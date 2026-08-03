import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Box, Heading, Text, Button, Spinner, Center } from '@chakra-ui/react';
import Layout from './components/Layout';
// 各頁面改用 lazy 載入，首次進站只需要下載當前頁面的程式碼，
// 而不是把 Dashboard/Mapping/Services/Recharge/TelegramGroups 全部打包進同一個 JS 檔。
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Mapping = lazy(() => import('./pages/Mapping'));
const Services = lazy(() => import('./pages/Services'));
const Recharge = lazy(() => import('./pages/Recharge'));
const Accounts = lazy(() => import('./pages/Accounts'));
const TelegramGroups = lazy(() => import('./pages/TelegramGroups'));
const TelegramGroupDetail = lazy(() => import('./pages/TelegramGroupDetail'));

function PageLoading() {
  return (
    <Center minH="60vh">
      <Spinner size="lg" color="blue.500" />
    </Center>
  );
}

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
        <Suspense fallback={<PageLoading />}>
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
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
