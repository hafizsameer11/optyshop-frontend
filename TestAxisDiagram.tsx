import React from 'react'
import AxisDiagram from './src/components/shop/AxisDiagram'

const TestAxisDiagram = () => {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <div>
        <h3>Right Eye OD: Axis -166°</h3>
        <AxisDiagram axisValue={-166} compact={true} />
      </div>
      <div>
        <h3>Left Eye OS: Axis -168°</h3>
        <AxisDiagram axisValue={-168} compact={true} />
      </div>
      <div>
        <h3>Full Version - Axis -166°</h3>
        <AxisDiagram axisValue={-166} />
      </div>
    </div>
  )
}

export default TestAxisDiagram
