import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDeleteBlobs } from "@shelby-protocol/react";
import { useConnectedAddress, useStorageSigner } from "@/features/wallet/store";
import { useLectures, useUnlockGrants } from "@/lib/index/hooks";
import { deleteLecture, extendLectureExpiration, fetchLecture } from "@/lib/index/catalogClient";
import { blobNameFromManifestPath, manifestPathFromBlobUrl } from "@/lib/shelby/blobUrl";
import { GlassPanel } from "@/components/ui/GlassPanel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState, ErrorState, LoadingState } from "@/components/ui/States";
import { Chip } from "@/components/ui/Chip";

const DAY_MICROS = 86_400 * 1_000_000;

export function StudioContentPage() {
  const address = useConnectedAddress();
  const { signer } = useStorageSigner();
  const deleteBlobs = useDeleteBlobs({});
  const queryClient = useQueryClient();
  const { data, isLoading, isError, refetch } = useLectures(address ? { creatorId: address } : {});
  const { data: grants } = useUnlockGrants(address ? { creatorId: address } : {});
  const [renewingId, setRenewingId] = useState<string | null>(null);
  const [renewError, setRenewError] = useState<{ id: string; message: string } | null>(null);
  const [renewedId, setRenewedId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string; buyerCount: number } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!address) {
    return (
      <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12">
        <EmptyState icon="account_balance_wallet" title="Connect a wallet" description="Content Management is scoped to your connected wallet's published lectures." />
      </div>
    );
  }

  if (isLoading) return <LoadingState title="Loading your content" className="max-w-container-max-width mx-auto" />;
  if (isError) return <ErrorState description="Couldn't reach the catalog index." onRetry={() => refetch()} className="max-w-container-max-width mx-auto" />;

  const lectures = data?.lectures ?? [];
  const now = Date.now() * 1000;

  async function renew(lectureId: string) {
    setRenewingId(lectureId);
    setRenewError(null);
    setRenewedId(null);
    try {
      // v1: extends the tracked expiry in our off-chain index only. The
      // Shelby SDK doesn't yet expose a blob-renewal/extend-duration method
      // (checked against @shelby-protocol/sdk@0.3.1) — once it does, this
      // should call the real renewal here before touching the catalog.
      const newExpiration = now + 90 * DAY_MICROS;
      await extendLectureExpiration(lectureId, newExpiration);
      await queryClient.invalidateQueries({ queryKey: ["lectures"] });
      setRenewedId(lectureId);
    } catch (err) {
      setRenewError({ id: lectureId, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setRenewingId(null);
    }
  }

  function buyerCountFor(lectureId: string): number {
    return grants?.filter((g) => g.lectureId === lectureId).length ?? 0;
  }

  function closeDeleteModal() {
    if (deleting) return;
    setDeleteTarget(null);
    setDeleteError(null);
  }

  async function confirmDelete() {
    if (!deleteTarget || !address) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      // Delete the real Shelby blobs first — signed by the creator's own
      // wallet, since there's no server-held key to do this anymore. Only
      // once that succeeds do we drop the catalog record, so a failed/partial
      // blob deletion never leaves a dangling listing pointing at nothing.
      if (!signer) throw new Error("Wallet signer unavailable — reconnect your wallet and try again.");
      const { lecture } = await fetchLecture(deleteTarget.id);
      const blobNames = [blobNameFromManifestPath(lecture.manifestPath)];
      const thumbPath = manifestPathFromBlobUrl(lecture.thumbnailUrl);
      if (thumbPath) blobNames.push(blobNameFromManifestPath(thumbPath));
      await deleteBlobs.mutateAsync({ signer, blobNames });

      await deleteLecture(deleteTarget.id, address);
      await queryClient.invalidateQueries({ queryKey: ["lectures"] });
      setDeleteTarget(null);
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : String(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="max-w-container-max-width mx-auto px-margin-mobile md:px-margin-desktop py-12 space-y-8">
      <h1 className="font-headline-lg text-headline-lg text-white">Content Management</h1>

      {lectures.length > 0 && (
        <div className="flex items-start gap-3 rounded-2xl border border-white/5 bg-surface-container-low px-5 py-4 text-on-surface-variant">
          <span className="material-symbols-outlined text-lg text-primary shrink-0">info</span>
          <p className="font-label-sm text-label-sm leading-relaxed">
            "Extend listing" pushes back the expiry shown below by 90 days. It only updates our catalog record — Shelby's SDK doesn't yet expose a way to
            renew a blob's actual storage duration, so the underlying video on Shelbynet still expires on its original schedule. Treat the date here as a
            listing deadline, not a guarantee of storage.
          </p>
        </div>
      )}

      {lectures.length === 0 ? (
        <EmptyState icon="video_library" title="No content yet" description="Published lectures and their real Shelbynet expiry will appear here." />
      ) : (
        <GlassPanel className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
                <th className="p-4">Lecture</th>
                <th className="p-4">Category</th>
                <th className="p-4">Price</th>
                <th className="p-4">Expires</th>
                <th className="p-4" />
              </tr>
            </thead>
            <tbody>
              {lectures.map((lecture) => {
                const daysLeft = Math.round((lecture.expirationMicros - now) / DAY_MICROS);
                const expiringSoon = daysLeft < 14;
                return (
                  <tr key={lecture.id} className="border-b border-white/5">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <img src={lecture.thumbnailUrl} alt="" className="w-16 h-10 rounded-lg object-cover" />
                        <span className="text-white font-body-md truncate">{lecture.title}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Chip tone={lecture.categoryTone}>{lecture.category}</Chip>
                    </td>
                    <td className="p-4 text-white font-body-md">${lecture.price.usd.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`font-label-sm text-label-sm ${expiringSoon ? "text-error" : "text-on-surface-variant"}`}>
                        {daysLeft > 0 ? `${daysLeft} days left` : "Expired"}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            loading={renewingId === lecture.id}
                            onClick={() => renew(lecture.id)}
                            title="Extends the catalog listing 90 days. Does not renew the underlying Shelby blob's storage duration — see the note above."
                          >
                            Extend listing
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => setDeleteTarget({ id: lecture.id, title: lecture.title, buyerCount: buyerCountFor(lecture.id) })}
                          >
                            Delete
                          </Button>
                        </div>
                        {renewedId === lecture.id && <span className="text-secondary-fixed font-label-sm text-label-sm">Listing extended +90 days</span>}
                        {renewError?.id === lecture.id && <span className="text-error font-label-sm text-label-sm max-w-48 text-right">{renewError.message}</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </GlassPanel>
      )}

      <Modal open={deleteTarget != null} onClose={closeDeleteModal} maxWidth="max-w-md">
        <div className="p-8 space-y-6">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-white mb-2">Delete lecture</h2>
            <p className="text-on-surface-variant font-body-md">{deleteTarget?.title}</p>
          </div>

          <div className="rounded-2xl bg-error/10 border border-error/30 p-4 space-y-2">
            <p className="text-error font-label-sm text-label-sm leading-relaxed">
              This is permanent. It deletes the actual video segments on Shelbynet (not just the listing) and can't be undone.
            </p>
            {deleteTarget && deleteTarget.buyerCount > 0 && (
              <p className="text-error font-bold text-label-sm">
                {deleteTarget.buyerCount} {deleteTarget.buyerCount === 1 ? "buyer has" : "buyers have"} already unlocked this lecture and will permanently
                lose access.
              </p>
            )}
          </div>

          {deleteError && <p className="text-error font-label-sm text-label-sm text-center break-words">{deleteError}</p>}

          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" disabled={deleting} onClick={closeDeleteModal}>
              Cancel
            </Button>
            <Button variant="danger" className="flex-1" loading={deleting} onClick={confirmDelete}>
              Delete permanently
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
