import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Heading, Text, Button } from '@chakra-ui/react';
import Layout from './components/Layout';
// We will create these components next
import Dashboard from './pages/Dashboard';
import Mapping from './pages/Mapping';
import Services from './pages/Services';
import Recharge from './pages/Recharge';
import Accounts from './pages/Accounts';
import TelegramGroups from './pages/TelegramGroups';
import TelegramGroupDetail from './pages/TelegramGroupDetail';

// Error Boundary 組件
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Application error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <Box p={8} textAlign="center" minH="100vh" display="flex" flexDirection="column" justifyContent="center" alignItems="center">
          <Heading mb={4} size="lg">發生錯誤</Heading>
          <Text mb={6} color="gray.600">應用程式發生未預期的錯誤</Text>
          <Button colorPalette="blue" onClick={this.handleReset}>
            重新整理頁面
          </Button>
        </Box>
      );
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="mapping" element={<Mapping />} />
            <Route path="services" element={<Services />} />
            <Route path="recharge" element={<Recharge />} />
            <Route path="groups" element={<TelegramGroups />} />
            <Route path="groups/:id" element={<TelegramGroupDetail />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
