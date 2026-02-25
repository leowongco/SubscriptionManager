import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will create these components next
import Dashboard from './pages/Dashboard';
import Mapping from './pages/Mapping';
import Services from './pages/Services';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="mapping" element={<Mapping />} />
          <Route path="services" element={<Services />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
