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
import CaseStudies from './pages/resources/CaseStudies'
import CaseStudyDetail from './pages/resources/CaseStudyDetail'
import HQPackshots from './pages/resources/HQPackshots'
import Support from './pages/resources/Support'
import HelpCenter from './pages/resources/HelpCenter'
import GuidesAndWebinars from './pages/resources/GuidesAndWebinars'
import Blog from './pages/resources/Blog'
import BlogDetail from './pages/resources/BlogDetail'
import OurHistory from './pages/whoWeAre/OurHistory'
import OurTechnology from './pages/whoWeAre/OurTechnology'
import JoinUs from './pages/whoWeAre/JoinUs'
import JobOpportunities from './pages/whoWeAre/JobOpportunities'
import JobApplication from './pages/whoWeAre/JobApplication'
import Products from './pages/shop/Products'
import ProductDetail from './pages/shop/ProductDetail'
import CategoryPage from './pages/shop/CategoryPage'
import Cart from './pages/shop/Cart'
import Checkout from './pages/shop/Checkout'
import Login from './pages/auth/Login'
import Register from './pages/auth/Register'
import ProtectedRoute from './components/customer/ProtectedRoute'
import ErrorBoundary from './components/ErrorBoundary'
import CustomerDashboard from './pages/customer/Dashboard'
import CustomerCart from './pages/customer/Cart'
import CustomerOrders from './pages/customer/Orders'
import OrderDetail from './pages/customer/OrderDetail'
import CustomerPrescriptions from './pages/customer/Prescriptions'
import CustomerProfile from './pages/customer/Profile'
import CustomerTransactions from './pages/customer/Transactions'
import TransactionDetail from './pages/customer/TransactionDetail'
import PageDetail from './pages/cms/PageDetail'
import FloatingLanguageSwitcher from './components/FloatingLanguageSwitcher'

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <FloatingLanguageSwitcher />
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
        <Route path="/case-studies" element={<CaseStudies />} />
        <Route path="/case-studies/:slug" element={<CaseStudyDetail />} />
        <Route path="/hq-packshots" element={<HQPackshots />} />
        <Route path="/support" element={<Support />} />
        <Route path="/help-center" element={<HelpCenter />} />
        <Route path="/guides-and-webinars" element={<GuidesAndWebinars />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogDetail />} />
        <Route path="/pages/:slug" element={<PageDetail />} />
        <Route path="/our-history" element={<OurHistory />} />
        <Route path="/our-technology" element={<OurTechnology />} />
        <Route path="/join-us" element={<JoinUs />} />
        <Route path="/job-opportunities" element={<JobOpportunities />} />
        <Route path="/job-application/:jobId" element={<JobApplication />} />
        <Route path="/shop" element={<Products />} />
        <Route path="/category/:categorySlug" element={<CategoryPage />} />
        <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryPage />} />
        <Route path="/category/:categorySlug/:subcategorySlug/:subSubcategorySlug" element={<CategoryPage />} />
        <Route path="/shop/product/:slug" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Customer Dashboard Routes */}
        <Route path="/customer/dashboard" element={<ProtectedRoute><CustomerDashboard /></ProtectedRoute>} />
        <Route path="/customer/cart" element={<ProtectedRoute><CustomerCart /></ProtectedRoute>} />
        <Route path="/customer/orders" element={<ProtectedRoute><CustomerOrders /></ProtectedRoute>} />
        <Route path="/customer/orders/:id" element={<ProtectedRoute><OrderDetail /></ProtectedRoute>} />
        <Route path="/customer/prescriptions" element={<ProtectedRoute><CustomerPrescriptions /></ProtectedRoute>} />
        <Route path="/customer/transactions" element={<ProtectedRoute><CustomerTransactions /></ProtectedRoute>} />
        <Route path="/customer/transactions/:id" element={<ProtectedRoute><TransactionDetail /></ProtectedRoute>} />
        <Route path="/customer/profile" element={<ProtectedRoute><CustomerProfile /></ProtectedRoute>} />
      </Routes>
    </Router>
    </ErrorBoundary>
  )
}

export default App
