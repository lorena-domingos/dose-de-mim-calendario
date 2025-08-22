import React, { useState, useEffect } from "react";
import DatePicker from "react-datepicker";
import {registerLocale} from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import ptBR from "date-fns/locale/pt-BR";
import { format, parseISO } from 'date-fns';
import sun from './assets/sun.png';
import moonIcon from './assets/moon.png';


registerLocale('pt-BR', ptBR)

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const [dados, setDados] = useState({ remedios: [], diarios: [] });
  const [selectedDate, setSelectedDate] = useState(null);
  const [editandoId, setEditandoId] = useState(null);
  const [novoTexto, setNovoTexto] = useState("");

  const iniciarEdicao = (id, texto) => {
    setEditandoId(id);
    setNovoTexto(texto);
  };

  useEffect(() => {
    fetch('http://localhost:5000/api/dados')
      .then(res => res.json())
      .then(data => setDados(data))
      .catch(err => console.error('Erro ao carregar entradas:', err));
  }, []);

  useEffect(() => {
    const modoSalvo = localStorage.getItem("modo");
    if (modoSalvo === "dark") {
      setDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.body.classList.add("dark-mode");
      localStorage.setItem("modo", "dark");
    } else {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("modo", "light");
    }
  }, [darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  const highlightDates = [
    ...dados.diarios,
    ...dados.remedios
  ]

  .filter(e => e.date || e.data)
    .map(e => {
      const dataStr = e.date || e.data;
      const [year, month, day] = dataStr.split('-');
      return new Date(year, month - 1, day, 12);
    });

    const filteredDiarios = selectedDate
    ? dados.diarios.filter(d => d.date === selectedDate.toISOString().split("T")[0])
    : [];

  const filteredRemedios = selectedDate
    ? dados.remedios.filter(r => r.data === selectedDate.toISOString().split("T")[0])
    : [];

  const salvarEdicao = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/dados/${editandoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ texto: novoTexto }),
      });
      if (!res.ok) throw new Error("Erro ao salvar");
      const data = await res.json();

      setDados(prev => ({
        ...prev,
        diarios: prev.diarios.map(d =>
          d.id === editandoId ? { ...d, texto: data.texto } : d
        )
      }));
      setEditandoId(null);
    } catch (error) {
      alert("Falha ao salvar a edição");
      console.error(error);
    }
  };


  return (
    <div className="calendario">
      <h2>Histórico</h2>

      <img 
        src={darkMode ? moonIcon : sun}
        alt={darkMode ? "Modo escuro ativo" : "Modo claro ativo"}
        onClick={toggleDarkMode}
        className="sun"
      />

      <DatePicker
        selected={selectedDate}
        onChange={(date) => setSelectedDate(date)}
        highlightDates={highlightDates}
        locale="pt-BR"
        dateFormat="dd-MM-yyyy"
        showIcon
        toggleCalendarOnIconClick
        placeholderText="Escolha uma data"
      />

      {selectedDate && (
        <>
          <h3>Entradas de Diário</h3>
          {filteredDiarios.length > 0 ? (
            <ul>
              {filteredDiarios.map((e, i) => {
                const dataFormatada = e.date ? format(parseISO(e.date), 'dd/MM/yyyy') : 'Data inválida';
                return (
                  <li key={i}>
                    {editandoId === e.id ? (
                      <>
                        <textarea
                          value={novoTexto}
                          onChange={(ev) => setNovoTexto(ev.target.value)}
                          rows={4}
                          style={{ width: "250px", resize: "vertical", padding: "8px", fontSize: "1rem", borderRadius: "6px", border: "1px solid #ccc", height: "150px"}}
                        />
                        <div className="buttons">
                          <button onClick={salvarEdicao}>Salvar</button>
                          <button onClick={() => setEditandoId(null)}>Cancelar</button>
                        </div>
                      </>
                    ) : (
                      <>
                        <strong>{dataFormatada}</strong>
                        <br />
                        <p>{e.texto}</p>
                        <button onClick={() => iniciarEdicao(e.id, e.texto)}>Editar</button>
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p>Nenhuma entrada de diário para essa data.</p>
          )}

          <h3>Registros de Remédio</h3>
          {filteredRemedios.length > 0 ? (
            <ul className="remedios-list">
              {filteredRemedios.map((e, i) => {
                const dataFormatada = e.data ? format(parseISO(e.data), 'dd/MM/yyyy') : 'Data inválida';
                return <li key={i}><strong>{dataFormatada}</strong> {e.tomou ? 'Tomou' : 'Não tomou'}</li>;
              })}
            </ul>
          ) : (
            <p>Nenhum registro de remédio para essa data.</p>
          )}
        </>
      )}
      <button className="botao" onClick={() => window.history.back()}>Voltar</button>
    </div>
  );
}

export default App;
