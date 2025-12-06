import './App.css'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import VirtualTest from './pages/products/VirtualTest'
import DigitalFrames from './pages/products/DigitalFrames'
import OpticalInstruments from './pages/products/OpticalInstruments'
import Viewer3D from './pages/products/Viewer3D'
import PDMeasurement from './pages/products/PDMeasurement'
import OpenInnovation from './pages/products/OpenInnovation'
import Online from './pages/solutions/Online'
import ThreeDResources from './pages/solutions/ThreeDResources'
import InStore from './pages/solutions/InStore'
import Ecommerce from './pages/solutions/Ecommerce'
import Webinar from './pages/solutions/Webinar'
import WebinarVideo from './pages/solutions/WebinarVideo'
import PricingRequest from './pages/solutions/PricingRequest'
import ThankYou from './pages/solutions/ThankYou'
import PupilDistance from './pages/solutions/PupilDistance'
import DriveToStore from './pages/solutions/DriveToStore'
import Contact from './pages/Contact'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/virtual-test" element={<VirtualTest />} />
        <Route path="/digital-frames" element={<DigitalFrames />} />
        <Route path="/optical-instruments" element={<OpticalInstruments />} />
        <Route path="/3d-viewer" element={<Viewer3D />} />
        <Route path="/pd-measurement" element={<PDMeasurement />} />
        <Route path="/open-innovation" element={<OpenInnovation />} />
        <Route path="/online" element={<Online />} />
        <Route path="/3d-resources" element={<ThreeDResources />} />
        <Route path="/in-store" element={<InStore />} />
        <Route path="/ecommerce" element={<Ecommerce />} />
        <Route path="/webinar" element={<Webinar />} />
        <Route path="/webinar-video" element={<WebinarVideo />} />
        <Route path="/pricing-request" element={<PricingRequest />} />
        <Route path="/thank-you" element={<ThankYou />} />
        <Route path="/pupil-distance" element={<PupilDistance />} />
        <Route path="/drive-to-store" element={<DriveToStore />} />
        <Route path="/contact" element={<Contact />} />
      </Routes>
    </Router>
  )
}

export default App
