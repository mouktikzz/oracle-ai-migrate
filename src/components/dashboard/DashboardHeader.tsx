
import React, { useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Database, History, HelpCircle, BookOpen } from 'lucide-react';
import UserDropdown from '@/components/UserDropdown';
import HomeButton from '@/components/HomeButton';
import { ChatbotToggle } from '@/components/ChatbotToggle';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
// import { CodeEditorThemeContext } from '@/contexts/CodeEditorThemeContext';

interface DashboardHeaderProps {
  onGoToHistory: () => void;
  onGoHome: () => void;
  onShowHelp: () => void;
  title?: string;
}

const DashboardHeader: React.FC<DashboardHeaderProps> = ({
  onGoToHistory,
  onGoHome,
  onShowHelp,
  title = "Migration Dashboard"
}) => {
  const { user } = useAuth();
  // const { isDarkMode, toggleDarkMode } = useContext(CodeEditorThemeContext);
  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HomeButton onClick={onGoHome} />
            <div className="flex items-center">
              <Database className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {user && <ChatbotToggle variant="header" isVisible={true} isCollapsed={false} />}
            <Button 
              variant="outline" 
              size="sm"
              onClick={onGoToHistory}
              className="flex items-center gap-2"
            >
              <History className="h-4 w-4" />
              History
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={onShowHelp}
              className="flex items-center gap-2"
            >
              <HelpCircle className="h-4 w-4" />
              Help
            </Button>
            <UserDropdown />
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
