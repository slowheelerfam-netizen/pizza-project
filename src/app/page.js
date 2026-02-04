'use client'

export default function Home() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Internal Pizza System</h1>

      <p>
        This application is for internal use only.
        Select a station below.
      </p>

      <ul>
        <li>
          <a href="/register">Register</a>
        </li>
        <li>
          <a href="/kitchen">Kitchen</a>
        </li>
        <li>
          <a href="/monitor">Monitor</a>
        </li>
        <li>
          <a href="/oven">Oven Station</a>
        </li>
      </ul>
    </main>
  )
}