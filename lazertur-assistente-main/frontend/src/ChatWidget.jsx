import React, { useState, useRef, useEffect } from 'react'
import robot from '../../assets/robot.png'
export default function ChatWidget(){
  const [messages, setMessages] = useState([
    {from:'ai', text:'Olá! Eu sou a Lu, assistente da Lazertur. Em que posso ajudar?'}
  ])
  const [input, setInput] = useState('')
  const containerRef = useRef(null)

  useEffect(()=>{
    if(containerRef.current){
      containerRef.current.scrollTop = containerRef.current.scrollHeight
    }
  }, [messages])

  async function sendMessage(){
    const text = input.trim()
    if(!text) return
    const userMsg = {from:'user', text}
    setMessages(m => [...m, userMsg])
    setInput('')
    try{
      const resp = await fetch('/api/chat', {
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ message: text })
      })
      const data = await resp.json()
      if(data.reply){
        setMessages(m => [...m, {from:'ai', text: data.reply}])
      } else {
        setMessages(m => [...m, {from:'ai', text: 'Desculpe, sem resposta do servidor.'}])
      }
    }catch(e){
      setMessages(m => [...m, {from:'ai', text: 'Erro ao contatar servidor.'}])
    }
  }

  return (
    <div className="chat-widget" role="dialog" aria-label="Chat com Lu">
      <div className="chat-header">
        <img src={robot} alt="Lu" className="robot-img" />
        <div>
          <strong>Lu</strong>
          <div className="subtitle">Assistente Lazertur</div>
        </div>
      </div>
      <div className="chat-messages" ref={containerRef}>
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.from}`}>{m.text}</div>
        ))}
      </div>
      <div className="chat-input-area">
        <input value={input} onChange={e=>setInput(e.target.value)} placeholder="Digite sua mensagem..." onKeyDown={(e)=>{ if(e.key==='Enter') sendMessage() }} />
        <button onClick={sendMessage}>Enviar</button>
      </div>
    </div>
  )
}
