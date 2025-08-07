import React, {useState} from "react";

const Counter = () => {
  const [num, setNumber] = useState(0);

  const increase = () => {
    setNumber(num + 1);
  };

  const decrease = () => {
    setNumber(num - 1);
  };

  return (
    <div>
      <button onClick={increase}>+1</button>
      <button onClick={decrease}>-1</button>

      <p>{num} 카운터 컴포넌트입니다.</p>
    </div>
  )
}

export default Counter;