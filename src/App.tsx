import { Route, Switch, useLocation } from 'wouter';
import { Home } from './pages/Home';
import { Search } from './pages/Search';

function App() {
  const [, setLocation] = useLocation();

  return (
    <div className="app-container">
      <Switch>
        <Route path="/" component={() => <Home onNavigate={setLocation} />} />
        <Route path="/search" component={Search} />

        {/* 404 / Catch-all */}
        <Route>
          <div className="h-screen flex-center flex-col">
            <h1 className="text-6xl font-black mb-4">404</h1>
            <p className="font-mono mb-8">Blob Not Found</p>
            <button
              onClick={() => setLocation('/')}
              className="bg-white border-3 border-black px-6 py-2 shadow-retro hover:shadow-retro-hover font-bold font-mono"
            >
              Return Home
            </button>
          </div>
        </Route>
      </Switch>
    </div>
  );
}

export default App;
