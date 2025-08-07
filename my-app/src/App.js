import React, {useState, useEffect} from "react";
import axios from "axios";

function App() {
  const [text, setText] = useState(""); 
  const [messages, setMessages] = useState([]);

 const fetchMessages = async () => {
    const res = await axios.get("http://localhost:5000/api/messages");
    setMessages(res.data);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    await axios.post("http://localhost:5000/api/save", { text });
    setText("");
    fetchMessages();
  };

  useEffect(() => {
    fetchMessages();
  }, []);

  return (
    <div style={{ padding: "20px"}}>
        <h1>메시지 저장</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
            placeholder="메시지를 입력하세요"   
        />
        <button type="submit">저장</button>
      </form>
      <ul>
        {messages.map((msg) => (
          <li key={msg.id}>{msg.text}</li>
        ))}
      </ul>
    </div>
  );
}

export default App;
