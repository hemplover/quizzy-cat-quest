
import { useNavigate } from "react-router-dom";
import { Cat, Home, Search } from "lucide-react";

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="text-center glass-card p-8 md:p-12 rounded-xl max-w-md">
        <div className="w-16 h-16 rounded-full bg-cat mx-auto flex items-center justify-center mb-6">
          <Cat className="w-8 h-8 text-white" />
        </div>
        
        <h1 className="text-4xl font-bold mb-2">404</h1>
        <p className="text-xl text-muted-foreground mb-6">
          Oops! This page is hiding better than a cat under a bed.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button 
            onClick={() => navigate('/')}
            className="cat-button-secondary"
          >
            <Home className="w-5 h-5" />
            Return Home
          </button>
          
          <button 
            onClick={() => navigate(-1)}
            className="cat-button"
          >
            <Search className="w-5 h-5" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
