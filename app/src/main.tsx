// Buffer polyfill loads as its own <script type="module"> tag in index.html,
// ahead of this one — see the comment there for why an `import` here isn't
// reliable once vendor deps are split into separate build chunks.
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
