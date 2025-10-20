import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import './index.css'
import {MinisContainer} from '@shopify/shop-minis-react'

import {App} from './App'
import {ErrorBoundary} from './components/ErrorBoundary'


createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <MinisContainer>
        <App />
      </MinisContainer>
    </ErrorBoundary>
  </StrictMode>
)
