import React, { useState } from 'react'
import { Routes, Route, useNavigate } from 'react-router-dom'
import TopMarquee from './components/TopMarquee.jsx'
import StartScreen from './pages/StartScreen.jsx'
import GameScreen from './pages/GameScreen.jsx'
import ResultScreen from './pages/ResultScreen.jsx'

const App = () => {
  const navigate = useNavigate()
  const [player1Name, setPlayer1Name] = useState('Player')
  const [player2Name, setPlayer2Name] = useState('SOLO')
  const [mode, setMode] = useState('single')
  const [category, setCategory] = useState('mixed')
  const [level, setLevel] = useState('easy')
  const [timerDuration, setTimerDuration] = useState(15)
  const [player1Score, setPlayer1Score] = useState(0)
  const [player2Score, setPlayer2Score] = useState(0)

  const [report, setReport] = useState(null)

  const startGame = (p1, p2, lvl, timer, m, cat) => {
    setPlayer1Name(p1); setPlayer2Name(p2); setLevel(lvl)
    setTimerDuration(timer); setMode(m); setCategory(cat)
    setPlayer1Score(0); setPlayer2Score(0)
    setReport(null)
    navigate('/game')
  }

  const finishGame = (s1, s2, rep) => {
    setPlayer1Score(s1); setPlayer2Score(s2)
    if (rep) setReport(rep)
    navigate('/result')
  }

  const goHome = () => {
    setPlayer1Score(0); setPlayer2Score(0); setReport(null)
    navigate('/')
  }

  return (
    <>
      <TopMarquee />
      <Routes>
        <Route path="/" element={<StartScreen onStart={startGame} />} />
        <Route path="/game" element={
          <GameScreen player1Name={player1Name} player2Name={player2Name}
            mode={mode} category={category} level={level} timerDuration={timerDuration}
            onFinish={finishGame} onHome={goHome} />
        } />
        <Route path="/result" element={
          <ResultScreen player1Name={player1Name} player2Name={player2Name}
            player1Score={player1Score} player2Score={player2Score}
            mode={mode} level={level} onReset={goHome} onHome={goHome}
            roundHistory={report?.roundHistory || []}
            questionStats={report?.questionStats || null}
            timerDuration={report?.timerDuration || timerDuration}
            answerLog={report?.answerLog || []}
          />
        } />
      </Routes>
    </>
  )
}

export default App