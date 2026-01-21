import React from 'react'
import AxisDiagram from './src/components/shop/AxisDiagram'

const TestAxisDiagram = () => {
  return (
    <div style={{ padding: '20px', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
      <div>
        <h3>Right Eye OD: Axis 135°</h3>
        <AxisDiagram axisValue={135} compact={true} />
      </div>
      <div>
        <h3>Left Eye OS: Axis 90°</h3>
        <AxisDiagram axisValue={90} compact={true} />
      </div>
      <div>
        <h3>Full Version - Axis 45°</h3>
        <AxisDiagram axisValue={45} />
      </div>
    </div>
  )
}

export default TestAxisDiagram
