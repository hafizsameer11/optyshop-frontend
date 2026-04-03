import './App.css'
import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useParams } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import ProtectedRoute from './components/customer/ProtectedRoute'
import FloatingLanguageSwitcher from './components/FloatingLanguageSwitcher'
import ScrollToTop from './components/ScrollToTop'
import PageLoader from './components/PageLoader'

const Home = lazy(() => import('./pages/Home'))
const VirtualTest = lazy(() => import('./pages/products/VirtualTest'))
const DigitalFrames = lazy(() => import('./pages/products/DigitalFrames'))
const OpticalInstruments = lazy(() => import('./pages/products/OpticalInstruments'))
const Viewer3D = lazy(() => import('./pages/products/Viewer3D'))
const PDMeasurement = lazy(() => import('./pages/products/PDMeasurement'))
const OpenInnovation = lazy(() => import('./pages/products/OpenInnovation'))
const Online = lazy(() => import('./pages/solutions/Online'))
const ThreeDResources = lazy(() => import('./pages/solutions/ThreeDResources'))
const InStore = lazy(() => import('./pages/solutions/InStore'))
const Ecommerce = lazy(() => import('./pages/solutions/Ecommerce'))
const Webinar = lazy(() => import('./pages/solutions/Webinar'))
const WebinarVideo = lazy(() => import('./pages/solutions/WebinarVideo'))
const PricingRequest = lazy(() => import('./pages/solutions/PricingRequest'))
const ThankYou = lazy(() => import('./pages/solutions/ThankYou'))
const PupilDistance = lazy(() => import('./pages/solutions/PupilDistance'))
const DriveToStore = lazy(() => import('./pages/solutions/DriveToStore'))
const Contact = lazy(() => import('./pages/Contact'))
const CaseStudies = lazy(() => import('./pages/resources/CaseStudies'))
const CaseStudyDetail = lazy(() => import('./pages/resources/CaseStudyDetail'))
const HQPackshots = lazy(() => import('./pages/resources/HQPackshots'))
const Support = lazy(() => import('./pages/resources/Support'))
const HelpCenter = lazy(() => import('./pages/resources/HelpCenter'))
const GuidesAndWebinars = lazy(() => import('./pages/resources/GuidesAndWebinars'))
const Blog = lazy(() => import('./pages/resources/Blog'))
const BlogDetail = lazy(() => import('./pages/resources/BlogDetail'))
const OurHistory = lazy(() => import('./pages/whoWeAre/OurHistory'))
const OurTechnology = lazy(() => import('./pages/whoWeAre/OurTechnology'))
const JoinUs = lazy(() => import('./pages/whoWeAre/JoinUs'))
const JobOpportunities = lazy(() => import('./pages/whoWeAre/JobOpportunities'))
const JobApplication = lazy(() => import('./pages/whoWeAre/JobApplication'))
const Products = lazy(() => import('./pages/shop/Products'))
const ProductDetail = lazy(() => import('./pages/shop/ProductDetail'))
const FlashOffers = lazy(() => import('./pages/shop/FlashOffers'))
const FlashOfferLanding = lazy(() => import('./pages/shop/FlashOfferLanding'))
const CategoryPage = lazy(() => import('./pages/shop/CategoryPage'))
const Cart = lazy(() => import('./pages/shop/Cart'))
const Checkout = lazy(() => import('./pages/shop/Checkout'))
const Payment = lazy(() => import('./pages/shop/Payment'))
const Wishlist = lazy(() => import('./pages/shop/Wishlist'))
const Login = lazy(() => import('./pages/auth/Login'))
const Register = lazy(() => import('./pages/auth/Register'))
const AccountLayout = lazy(() => import('./components/account/AccountLayout'))
const CustomerOrders = lazy(() => import('./pages/customer/Orders'))
const OrderDetail = lazy(() => import('./pages/customer/OrderDetail'))
const CustomerProfile = lazy(() => import('./pages/customer/Profile'))
const CustomerTransactions = lazy(() => import('./pages/customer/Transactions'))
const TransactionDetail = lazy(() => import('./pages/customer/TransactionDetail'))
const PageDetail = lazy(() => import('./pages/cms/PageDetail'))
const SearchResults = lazy(() => import('./pages/SearchResults'))
const SubcategoryFilterTest = lazy(() => import('./components/debug/SubcategoryFilterTest'))

const ProductRedirect = () => {
    const { slug } = useParams<{ slug: string }>()
    return <Navigate to={`/shop/product/${slug}`} replace />
}

const RedirectCustomerOrder = () => {
    const { id } = useParams<{ id: string }>()
    return <Navigate to={`/account/orders/${id}`} replace />
}

const RedirectCustomerTransaction = () => {
    const { id } = useParams<{ id: string }>()
    return <Navigate to={`/account/payments/${id}`} replace />
}

function App() {
    return (
        <ErrorBoundary>
            <Router>
                <ScrollToTop />
                <FloatingLanguageSwitcher />
                <Suspense fallback={<PageLoader />}>
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
                        <Route path="/shop/flash-offers" element={<FlashOffers />} />
                        <Route path="/flash-offers/:id" element={<FlashOfferLanding />} />
                        <Route path="/shop/sunglasses" element={<Products />} />
                        <Route path="/shop/eyeglasses" element={<Products />} />
                        <Route path="/shop/contact-lenses" element={<Products />} />
                        <Route path="/shop/eye-hygiene" element={<Products />} />
                        <Route path="/category/:categorySlug" element={<CategoryPage />} />
                        <Route path="/category/:categorySlug/:subcategorySlug" element={<CategoryPage />} />
                        <Route path="/category/:categorySlug/:subcategorySlug/:subSubcategorySlug" element={<CategoryPage />} />
                        <Route path="/product/:slug" element={<ProductRedirect />} />
                        <Route path="/shop/product/:slug" element={<ProductDetail />} />
                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
                        <Route path="/wishlist" element={<Wishlist />} />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/test-subcategories" element={<SubcategoryFilterTest />} />

                        <Route
                            path="/account"
                            element={
                                <ProtectedRoute>
                                    <AccountLayout />
                                </ProtectedRoute>
                            }
                        >
                            <Route index element={<Navigate to="orders" replace />} />
                            <Route path="profile" element={<CustomerProfile />} />
                            <Route path="orders" element={<CustomerOrders />} />
                            <Route path="orders/:id" element={<OrderDetail />} />
                            <Route path="payments" element={<CustomerTransactions />} />
                            <Route path="payments/:id" element={<TransactionDetail />} />
                        </Route>

                        <Route path="/customer/dashboard" element={<Navigate to="/account/orders" replace />} />
                        <Route path="/customer/cart" element={<Navigate to="/cart" replace />} />
                        <Route path="/customer/orders" element={<Navigate to="/account/orders" replace />} />
                        <Route path="/customer/orders/:id" element={<RedirectCustomerOrder />} />
                        <Route path="/customer/prescriptions" element={<Navigate to="/account/orders" replace />} />
                        <Route path="/customer/transactions" element={<Navigate to="/account/payments" replace />} />
                        <Route path="/customer/transactions/:id" element={<RedirectCustomerTransaction />} />
                        <Route path="/customer/profile" element={<Navigate to="/account/profile" replace />} />
                    </Routes>
                </Suspense>
            </Router>
        </ErrorBoundary>
    )
}

export default App
