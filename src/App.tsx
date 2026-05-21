import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
// We will create these components next
import Dashboard from './pages/Dashboard';
import Mapping from './pages/Mapping';
import Services from './pages/Services';
import Recharge from './pages/Recharge';
import Accounts from './pages/Accounts';
import TelegramGroups from './pages/TelegramGroups';
import TelegramGroupDetail from './pages/TelegramGroupDetail';

function App() {
  return (
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
  );
}

export default App;
