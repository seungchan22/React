import React, {useState} from "react";

const Input2 = () => {
  const [Inputs, setInputs] = useState({
    name: "",
    email: "",
    tel: ""
  });

  const { name, email, tel } = Inputs;

  const onChange = (e) => {
    const value = e.target.value;
    const id = e.target.id;
    setInputs({
      ...Inputs,
      [id]: value
    });
  };

  return (
    <div>
       <div>
           <label>이름</label>
           <input type="text" id="name" value={Inputs.name} onChange={onChange} />
       </div>
        <div>
           <label>이메일</label>
           <input type="email" id="email" value={Inputs.email} onChange={onChange} />
       </div>
       <div>
           <label>전화번호</label>
           <input type="tel" id="tel" value={Inputs.tel} onChange={onChange} />
       </div>
       <p>이름: {name}</p>
       <p>이메일: {email}</p>
       <p>전화번호: {tel}</p>
    </div>
  )
}

export default Input2;