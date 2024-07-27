import React, { useState } from 'react';

const QAForm = () => {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState(null);

  const handleQuestionChange = (event) => {
    setQuestion(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
        const response = await fetch('http://localhost:8000/v1/qa-create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: question }),
      });
      if (response.ok) {
        const data = await response.json();
        setAnswer(data.answer);
      }
    } catch (error) {
      console.error('Error during Q&A interaction:', error);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input type="text" value={question} onChange={handleQuestionChange} placeholder="Ask a question" />
        <button type="submit">Submit</button>
      </form>
      {answer && <p>Answer: {answer}</p>}
    </div>
  );
};

export default QAForm;