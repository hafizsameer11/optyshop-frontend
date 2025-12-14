import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { getPageBySlug, type Page } from '../../services/pagesService';

const PageDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState<Page | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPage = async () => {
      if (!slug) {
        setError('Page slug is required');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const pageData = await getPageBySlug(slug);
        
        if (pageData) {
          if (!pageData.is_active) {
            setError('This page is not available');
            setLoading(false);
            return;
          }
          setPage(pageData);
          
          // Update document title
          if (pageData.meta_title) {
            document.title = pageData.meta_title;
          } else {
            document.title = pageData.title;
          }
          
          // Update meta description if available
          if (pageData.meta_description) {
            const metaDescription = document.querySelector('meta[name="description"]');
            if (metaDescription) {
              metaDescription.setAttribute('content', pageData.meta_description);
            }
          }
        } else {
          setError('Page not found');
        }
      } catch (err) {
        console.error('Error fetching page:', err);
        setError('Failed to load page');
      } finally {
        setLoading(false);
      }
    };

    fetchPage();
  }, [slug]);

  if (loading) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto">
            <div className="animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="bg-white min-h-screen">
        <Navbar />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Page Not Found</h1>
            <p className="text-gray-600 mb-8">{error || 'The page you are looking for does not exist.'}</p>
            <button
              onClick={() => navigate('/')}
              className="bg-teal-500 text-white px-6 py-3 rounded-lg font-medium hover:bg-teal-600 transition-colors"
            >
              Go to Homepage
            </button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <Navbar />
      
      {/* Breadcrumbs */}
      <div className="bg-white py-6 md:py-8 px-4 md:px-6 border-b-4 border-teal-500">
        <div className="w-[90%] mx-auto">
          <div className="flex flex-wrap items-center gap-2 md:gap-4 text-xs md:text-sm mb-4 md:mb-6">
            <div className="flex items-center gap-2 text-teal-500">
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>HOME</span>
            </div>
            <span className="text-teal-500">/</span>
            <span className="text-gray-600 uppercase">{page.title}</span>
          </div>
        </div>
      </div>

      {/* Page Content */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 md:mb-8">
            {page.title}
          </h1>
          
          <div 
            className="prose prose-lg max-w-none
              prose-headings:text-gray-900
              prose-p:text-gray-700
              prose-a:text-teal-500 prose-a:no-underline hover:prose-a:underline
              prose-strong:text-gray-900
              prose-ul:text-gray-700
              prose-ol:text-gray-700
              prose-li:text-gray-700
              prose-img:rounded-lg prose-img:shadow-lg
              prose-blockquote:border-teal-500 prose-blockquote:text-gray-700
              prose-code:text-teal-600 prose-code:bg-gray-100 prose-code:px-1 prose-code:py-0.5 prose-code:rounded
              prose-pre:bg-gray-900 prose-pre:text-gray-100"
            dangerouslySetInnerHTML={{ __html: page.content }}
          />
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default PageDetail;

