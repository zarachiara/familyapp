import { Home, ListTodo, BarChart3, FileText, Users, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const Header = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Dashboard' },
    { path: '/tasks', icon: ListTodo, label: 'Tasks' },
    { path: '/fairness', icon: BarChart3, label: 'Fairness' },
    { path: '/templates', icon: FileText, label: 'Templates' },
    { path: '/family', icon: Users, label: 'Family' },
  ];

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-2">
            <div className="text-2xl">🏠</div>
            <h1 className="text-xl font-bold text-gray-900">FamilyFlow</h1>
          </div>

          <nav className="hidden md:flex items-center space-x-1">
            {navItems.map(item => (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors',
                  location.pathname === item.path
                    ? 'bg-purple-100 text-purple-700'
                    : 'text-gray-600 hover:bg-gray-100'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          <Link
            to="/settings"
            className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-5 h-5" />
          </Link>
        </div>

        {/* Mobile Navigation */}
        <nav className="md:hidden flex items-center justify-around py-2 border-t border-gray-200">
          {navItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors',
                location.pathname === item.path
                  ? 'text-purple-700'
                  : 'text-gray-600'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
};

export default Header;