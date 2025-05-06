import "./App.css"; // If you have App.css, otherwise remove or ensure it's empty/minimal
// Make sure your main CSS file (e.g., index.css) with Tailwind directives is imported in main.jsx or here

function App() {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4">
      <header className="mb-8">
        <h1 className="text-4xl font-bold text-blue-600">ProjecTrack PWA</h1>
      </header>

      <main className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">
          Frontend Setup Test
        </h2>
        <p className="text-gray-600 mb-2">
          If you see this, Vite and React are working!
        </p>
        <p className="text-gray-600 mb-4">
          The styling indicates that Tailwind CSS is also correctly configured.
        </p>
        <button className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded">
          Styled Button
        </button>

        <div className="mt-6 p-4 border border-dashed border-purple-400 rounded">
          <h3 className="text-lg font-semibold text-purple-700">
            PWA Test Info
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            Check your browser's developer tools (Application &gt; Manifest and
            Application &gt; Service Workers) to see if the manifest.json is
            loaded and the service worker is registered. You might need to
            refresh the page once after the first load for the service worker to
            activate.
          </p>
        </div>
      </main>

      <footer className="mt-8 text-center">
        <p className="text-sm text-gray-500">
          &copy; {new Date().getFullYear()} ProjecTrack. All rights reserved.
        </p>
      </footer>
    </div>
  );
}

export default App;
