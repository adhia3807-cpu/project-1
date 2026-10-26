import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar.tsx';
import { CustomerKiosk } from './components/CustomerKiosk.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { AdminLogin } from './components/AdminLogin.tsx';
import { RobotSimulatorModal } from './components/RobotSimulatorModal.tsx';
import {
  getProducts,
  getAdvertisements,
  getActiveAdvertisement,
  getQuestionHistory,
  getRobotTelemetry,
  getAnalytics,
  getProductKnowledge,
  createAdvertisement,
} from './api.ts';
import {
  Product,
  Advertisement,
  StructuredKnowledge,
  QuestionLog,
  RobotTelemetry,
  AnalyticsSummary,
} from './types.ts';

export default function App() {
  const [currentView, setCurrentView] = useState<'customer' | 'admin'>('customer');
  const [adminUser, setAdminUser] = useState<{ id: string; name: string; role: string } | null>(() => {
    try {
      const saved = localStorage.getItem('robo_admin_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [products, setProducts] = useState<Product[]>([]);
  const [advertisements, setAdvertisements] = useState<Advertisement[]>([]);
  const [activeAd, setActiveAd] = useState<Advertisement | null>(null);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [activeKnowledge, setActiveKnowledge] = useState<StructuredKnowledge | null>(null);
  const [knowledgeMap, setKnowledgeMap] = useState<Record<string, StructuredKnowledge>>({});
  const [questionLogs, setQuestionLogs] = useState<QuestionLog[]>([]);
  const [robotTelemetry, setRobotTelemetry] = useState<RobotTelemetry | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummary | null>(null);
  const [speechEnabled, setSpeechEnabled] = useState(true);
  const [isRobotSimOpen, setIsRobotSimOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load all system data from real persistent database
  const loadData = async () => {
    try {
      const [prods, ads, activeInfo, logs, telemetry, analyticsSummary] = await Promise.all([
        getProducts(),
        getAdvertisements(),
        getActiveAdvertisement(),
        getQuestionHistory(),
        getRobotTelemetry(),
        getAnalytics(),
      ]);

      const validProds = Array.isArray(prods) ? prods : [];
      setProducts(validProds);
      setAdvertisements(Array.isArray(ads) ? ads : []);
      setActiveAd(activeInfo?.advertisement || null);
      setActiveProduct(activeInfo?.product || null);
      setActiveKnowledge(activeInfo?.knowledge || null);
      setQuestionLogs(Array.isArray(logs) ? logs : []);
      setRobotTelemetry(telemetry || null);
      setAnalytics(analyticsSummary || null);

      // Load knowledge for all products
      const kMap: Record<string, StructuredKnowledge> = {};
      await Promise.all(
        validProds.map(async (p) => {
          try {
            const k = await getProductKnowledge(p.id);
            if (k) kMap[p.id] = k;
          } catch (e) {
            // ignore
          }
        })
      );
      setKnowledgeMap(kMap);
    } catch (err) {
      console.error('Error loading initial data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    // Heartbeat to refresh active ad timer and question logs
    const interval = setInterval(async () => {
      try {
        const activeInfo = await getActiveAdvertisement();
        setActiveAd(activeInfo?.advertisement || null);
        setActiveProduct(activeInfo?.product || null);
        setActiveKnowledge(activeInfo?.knowledge || null);

        const [logs, telemetry, analyticsSummary] = await Promise.all([
          getQuestionHistory(),
          getRobotTelemetry(),
          getAnalytics(),
        ]);
        setQuestionLogs(Array.isArray(logs) ? logs : []);
        setRobotTelemetry(telemetry || null);
        setAnalytics(analyticsSummary || null);
      } catch (e) {
        // silent heartbeat catch
      }
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // Handler to switch active broadcast on the robot screen instantly
  const handleSelectProductToBroadcast = async (productId: string) => {
    try {
      const targetProd = products.find((p) => p.id === productId);
      if (!targetProd) return;

      await createAdvertisement({
        product_id: productId,
        title: targetProd.name,
        tagline: targetProd.tagline,
        duration_minutes: 60,
        status: 'running',
        priority: 5,
        auto_loop: true,
      });

      await loadData();
    } catch (err) {
      console.error('Error broadcasting product:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('robo_admin_token');
    localStorage.removeItem('robo_admin_user');
    setAdminUser(null);
    setCurrentView('customer');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      {/* Universal Top Navbar */}
      <Navbar
        currentView={currentView}
        onViewChange={(v) => setCurrentView(v)}
        activeProduct={activeProduct}
        activeAd={activeAd}
        allProducts={products}
        onSelectProductToBroadcast={handleSelectProductToBroadcast}
        speechEnabled={speechEnabled}
        onToggleSpeech={() => setSpeechEnabled(!speechEnabled)}
        batteryLevel={robotTelemetry?.battery_level || 94}
        onOpenRobotSim={() => setIsRobotSimOpen(false)}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <div className="flex-1">
        {isLoading ? (
          <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-950">
            <div className="text-center space-y-3">
              <div className="w-10 h-10 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-mono text-cyan-400 tracking-wider">
                INITIALIZING AI ADVERTISEMENT ROBOT ENGINE...
              </p>
            </div>
          </div>
        ) : currentView === 'customer' ? (
          <CustomerKiosk
            product={activeProduct}
            advertisement={activeAd}
            knowledge={activeKnowledge}
            speechEnabled={speechEnabled}
            onToggleSpeech={() => setSpeechEnabled(!speechEnabled)}
          />
        ) : !adminUser ? (
          /* Protected Admin Route: Render Login if unauthenticated */
          <AdminLogin
            onLoginSuccess={(user) => {
              setAdminUser(user);
            }}
            onCancel={() => {
              setCurrentView('customer');
            }}
          />
        ) : (
          /* Authenticated Admin Dashboard */
          <AdminDashboard
            products={products}
            advertisements={advertisements}
            activeAd={activeAd}
            activeProduct={activeProduct}
            knowledgeMap={knowledgeMap}
            questionLogs={questionLogs}
            robotTelemetry={robotTelemetry}
            analytics={analytics}
            adminUser={adminUser}
            onRefreshData={loadData}
            onSelectProductToBroadcast={handleSelectProductToBroadcast}
            onLogout={handleLogout}
          />
        )}
      </div>

      {/* Physical Robot Hardware Chassis Simulator Modal */}
      <RobotSimulatorModal
        isOpen={isRobotSimOpen}
        onClose={() => setIsRobotSimOpen(false)}
        telemetry={robotTelemetry}
        activeProduct={activeProduct}
        activeAd={activeAd}
        onSwitchToKiosk={() => {
          setCurrentView('customer');
        }}
      />
    </div>
  );
}
