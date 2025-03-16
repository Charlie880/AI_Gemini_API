import React, { useState } from "react";
import "./App.css";

// SVGs for user and bot avatars
const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="avatar-icon">
    <path d="M12 2a5 5 0 1 0 5 5 5 5 0 0 0-5-5zm0 8a3 3 0 1 1 3-3 3 3 0 0 1-3 3zm9 11v-1a7 7 0 0 0-7-7h-4a7 7 0 0 0-7 7v1h2v-1a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v1z" />
  </svg>
);

const BotIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="avatar-icon">
    <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm-1-9h2v2h-2zm0-4h2v2h-2zm4 0h2v2h-2zm0 4h2v2h-2z" />
  </svg>
);

const App = () => {
  const [messages, setMessages] = useState([
    {
      id: "1",
      content: "Hello! How can I help you today?",
      role: "assistant",
      timestamp: new Date().toLocaleTimeString(),
    },
  ]);
  const [input, setInput] = useState("");
  const [temperature, setTemperature] = useState(0.7);
  const [maxLength, setMaxLength] = useState(100);
  const [topP, setTopP] = useState(0.9);
  const [topK, setTopK] = useState(50);
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [parameterFeedback, setParameterFeedback] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [debugTraces, setDebugTraces] = useState([]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newUserMessage = {
      id: Date.now().toString(),
      content: input,
      role: "user",
      timestamp: new Date().toLocaleTimeString(),
    };

    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setIsLoading(true);

    // Capture debugging information
    const debugTrace = {
      timestamp: new Date().toLocaleTimeString(),
      input: input,
      parameters: {
        temperature,
        top_k: topK,
        top_p: topP,
        max_output_tokens: maxLength,
      },
      response: null,
      error: null,
      latency: null,
    };

    try {
      const startTime = Date.now();

      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          temperature,
          top_k: topK,
          top_p: topP,
          max_output_tokens: maxLength,
        }),
      });

      const data = await response.json();

      const newAiMessage = {
        id: (Date.now() + 1).toString(),
        content: data.response,
        role: "assistant",
        timestamp: new Date().toLocaleTimeString(),
      };
      setMessages((prev) => [...prev, newAiMessage]);

      // Update debug trace with response and latency
      debugTrace.response = data.response;
      debugTrace.latency = Date.now() - startTime;
    } catch (error) {
      console.error("Error sending message:", error);

      // Update debug trace with error
      debugTrace.error = error.message;
    } finally {
      setIsLoading(false);

      // Add the debug trace to the debugging section
      setDebugTraces((prev) => [debugTrace, ...prev]);
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
      console.log("Selected file:", selectedFile.name);
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!file) {
      alert("Please select a file first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("http://localhost:8000/fine-tune", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const data = await response.json();
      console.log("File upload response:", data);
      alert("File uploaded successfully!");
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("Failed to upload file. Please check the console for details.");
    }
  };

  return (
    <div className="app-container">
      {/* Left Panel - Model Parameters */}
      <div className="left-panel">
        <h2>Model Parameters</h2>
        <div className="parameter">
          <label>Temperature: {temperature}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
          />
          <p className="parameter-description">
            <strong>Temperature</strong> controls the randomness of the model's output. 
            <ul>
              <li>Lower values (e.g., 0.2) make the output more deterministic and focused.</li>
              <li>Higher values (e.g., 0.8) increase creativity and diversity but may reduce coherence.</li>
            </ul>
          </p>
        </div>
        <div className="parameter">
          <label>Max Length: {maxLength}</label>
          <input
            type="number"
            value={maxLength}
            onChange={(e) => setMaxLength(parseInt(e.target.value))}
            min="1"
            max="2000"
          />
          <p className="parameter-description">
            <strong>Max Length</strong> limits the number of tokens in the response.
            <ul>
              <li>Smaller values produce shorter, more concise responses.</li>
              <li>Larger values allow for longer, more detailed answers.</li>
            </ul>
          </p>
        </div>
        <div className="parameter">
          <label>Top P: {topP}</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={topP}
            onChange={(e) => setTopP(parseFloat(e.target.value))}
          />
          <p className="parameter-description">
            <strong>Top P</strong> (nucleus sampling) controls the diversity of the output by limiting the model to the smallest set of tokens whose cumulative probability exceeds `p`.
            <ul>
              <li>Lower values (e.g., 0.5) make the output more focused and deterministic.</li>
              <li>Higher values (e.g., 0.9) allow for more diverse and creative responses.</li>
            </ul>
          </p>
        </div>
        <div className="parameter">
          <label>Top K: {topK}</label>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={topK}
            onChange={(e) => setTopK(parseInt(e.target.value))}
          />
          <p className="parameter-description">
            <strong>Top K</strong> limits the model to the top-k most likely tokens at each step.
            <ul>
              <li>Lower values (e.g., 10) make the output more focused and deterministic.</li>
              <li>Higher values (e.g., 50) allow for more diversity in the responses.</li>
            </ul>
          </p>
        </div>
      </div>

      {/* Middle Panel - Chat Interface */}
      <div className="middle-panel">
        <div className="chat-window">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`message ${message.role === "user" ? "user" : "assistant"}`}
            >
              <div className="avatar">
                {message.role === "user" ? <UserIcon /> : <BotIcon />}
              </div>
              <div className="message-content">
                <pre>{message.content}</pre>
                <p className="timestamp">{message.timestamp}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="message assistant">
              <div className="avatar">
                <BotIcon />
              </div>
              <div className="message-content">
                <p>Thinking...</p>
              </div>
            </div>
          )}
        </div>

        <form onSubmit={handleSendMessage} className="chat-input">
          {/* <label htmlFor="file-upload" className="attach-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="attach-icon">
              <path d="M8.5 13.5l3 3 7-7-1.5-1.5-5.5 5.5-1.5-1.5 5.5-5.5L15 6l-7 7-3-3V18h15V4h2v16H4V6h2v7.5z" />
            </svg>
            <span className="tooltip">Attach File</span>
          </label> */}
          <input
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            style={{ display: "none" }}
          />
          {fileName && <span className="file-name">{fileName}</span>}
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
          />
          <button type="submit" className="send-button">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="send-icon">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
            </svg>
          </button>
        </form>

        {/* Debugging Section */}
        <div className="debug-section">
          <h3>Debugging Traces</h3>
          {debugTraces.map((trace, index) => (
            <div key={index} className="debug-trace">
              <p><strong>Timestamp:</strong> {trace.timestamp}</p>
              <p><strong>Input:</strong> {trace.input}</p>
              <p><strong>Parameters:</strong> {JSON.stringify(trace.parameters, null, 2)}</p>
              {trace.response && (
                <p><strong>Response:</strong> <pre>{trace.response}</pre></p>
              )}
              {trace.error && (
                <p><strong>Error:</strong> <span className="error">{trace.error}</span></p>
              )}
              {trace.latency && (
                <p><strong>Latency:</strong> {trace.latency} ms</p>
              )}
              <hr />
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Documentation */}
      <div className="right-panel">
        <h2>AI Chatbot Project</h2>
        <p>
          This chatbot is powered by <strong>Gemini</strong>, a state-of-the-art Large Language Model (LLM) developed by
          Google. It uses advanced natural language processing to generate human-like responses.
        </p>

        <h3>How It Works</h3>
        <p>
          The chatbot uses a transformer-based architecture to process input text and generate responses. It leverages
          self-attention mechanisms to understand context and produce coherent answers.
        </p>

        <h3>Fine-Tuning the Model</h3>
        <p>
          <strong>Fine-tuning</strong> is the process of adapting a pre-trained model to a specific task or dataset. By training the model further on a smaller, task-specific dataset, you can improve its performance for your use case.
        </p>

        {/* <h4>Why Fine-Tune?</h4>
        <ul>
          <li><strong>Specialization</strong>: Tailor the model to understand domain-specific language or tasks.</li>
          <li><strong>Improved Accuracy</strong>: Achieve better results on your specific dataset compared to the general-purpose model.</li>
          <li><strong>Customization</strong>: Adapt the model to your unique requirements.</li>
        </ul>

        <h4>How to Fine-Tune</h4>
        <p>
          To fine-tune the model, follow these steps:
        </p>
        <ol>
          <li>
            <strong>Prepare Your Dataset</strong>: Collect and preprocess a dataset relevant to your task. Ensure the data is clean and formatted correctly.
          </li>
          <li>
            <strong>Upload Your Dataset</strong>: Use the "Attach File" button in the chat interface to upload your dataset. Supported formats include <code>.csv</code>, <code>.json</code>, or <code>.txt</code>.
          </li>
          <li>
            <strong>Start Fine-Tuning</strong>: Once the file is uploaded, the model will begin fine-tuning automatically. This process may take some time depending on the size of your dataset.
          </li>
          <li>
            <strong>Test the Fine-Tuned Model</strong>: After fine-tuning is complete, interact with the chatbot to see how it performs on your specific task.
          </li>
        </ol>

        <h4>Best Practices</h4>
        <ul>
          <li>Use a diverse and representative dataset for fine-tuning.</li>
          <li>Monitor the model's performance during fine-tuning to avoid overfitting.</li>
          <li>Experiment with different hyperparameters (e.g., learning rate, batch size) to achieve optimal results.</li>
        </ul> */}
      </div>
    </div>
  );
};

export default App;