import React from 'react'

export default function App() {
  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 font-sans">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400 mb-3">
          Sandbox Ready
        </h1>
        <p className="text-slate-400 text-sm">
          Your React application sandbox is active and running. The AI agent will update this app based on your prompts!
        </p>
      </div>
    </div>
  )
}
