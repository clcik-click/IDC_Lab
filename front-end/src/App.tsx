function App() {
  return (
    <>
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-blue-400">Tailwind Test</h1>
            <p className="text-sm text-gray-300">This button should hover pink</p>
            <button className="bg-pink-500 hover:bg-pink-600 px-4 py-2 rounded-lg shadow">
              Click Me
            </button>
          </div>
        </div>   
    </>
  )
}

export default App
