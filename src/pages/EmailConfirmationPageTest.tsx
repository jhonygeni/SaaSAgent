import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

const EmailConfirmationPageSimple = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    console.log("🚀 EmailConfirmationPageSimple carregou");
    console.log("URL atual:", window.location.href);
    
    // Extrair parâmetros
    const urlParams = new URLSearchParams(window.location.search);
    console.log("Parâmetros da URL:");
    urlParams.forEach((value, key) => {
      console.log(`  ${key}: ${value}`);
    });

    const error = urlParams.get("error");
    const errorCode = urlParams.get("error_code");
    const errorDescription = urlParams.get("error_description");

    console.log("Valores extraídos:");
    console.log("error:", error);
    console.log("errorCode:", errorCode);
    console.log("errorDescription:", errorDescription);

    if (error) {
      console.log("✅ Erro detectado!");
      
      if (error === "access_denied" && errorCode === "otp_expired") {
        console.log("🎯 Condição específica atendida!");
        setStatus("error");
        setMessage("TESTE: Link expirado detectado corretamente!");
      } else {
        console.log("❌ Condição específica não atendida");
        setStatus("error");
        setMessage(`Erro genérico: ${errorDescription || error}`);
      }
    } else {
      console.log("❌ Nenhum erro detectado");
      setStatus("error");
      setMessage("Nenhum parâmetro de erro encontrado");
    }
  }, []);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      <h1>Email Confirmation - Teste Simples</h1>
      <div style={{ 
        padding: '20px', 
        backgroundColor: status === 'error' ? '#f8d7da' : '#d4edda',
        border: `1px solid ${status === 'error' ? '#f5c6cb' : '#c3e6cb'}`,
        borderRadius: '5px',
        margin: '20px 0'
      }}>
        <h2>Status: {status}</h2>
        <p>{message}</p>
      </div>
      
      <div style={{ 
        backgroundColor: '#f8f9fa', 
        padding: '15px', 
        borderRadius: '5px',
        marginTop: '20px'
      }}>
        <h3>Debug Info:</h3>
        <p><strong>URL atual:</strong> {window.location.href}</p>
        <p><strong>Search params:</strong> {window.location.search}</p>
      </div>
    </div>
  );
};

export default EmailConfirmationPageSimple;
