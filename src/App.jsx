
import React, { useState, useRef, useEffect } from 'react'
import ReactECharts from 'echarts-for-react';
import axios from 'axios';
import * as turf from '@turf/turf'
import { useInterval } from 'ahooks';
import './App.css';


export default function App() {



  const mycharts = useRef()
  const [option, setEchartsOption] = useState({})

  const [lines, setLines] = useState([])
  const [historybusdata, sethistorybusdata] = useState([])
  const bus_plate_hash = {
    "298": { "plate": "粤BDF298" },
    "363": { "plate": "粤BDF363" },
    "8040": { "plate": "粤BDF040" },
    "8147": { "plate": "粤BDF147" },
    "8267": { "plate": "粤BDF267" },
    "8330": { "plate": "粤BDF330" },
    "8335": { "plate": "粤BDF335" },
    "8338": { "plate": "粤BDF338" },
    "8345": { "plate": "粤BDF345" },
    "8365": { "plate": "粤BDF365" },
    "8371": { "plate": "粤BDF371" },
    "8411": { "plate": "粤BDF411" },
    "8421": { "plate": "粤BDF421" },
    "8430": { "plate": "粤BDF430" },
    "8447": { "plate": "粤BDF447" },
    "8458": { "plate": "粤BDF458" },
    "8470": { "plate": "粤BDF470" },
    "8471": { "plate": "粤BDF471" },
    "18447": { "plate": "粤BDF447" }
  }

  useEffect(() => {
    setEchartsOption({
      tooltip: {
        show: false,
      },
      title: [{
        text: '南科大校巴实时位置(by小旭学长)',
        subtext: '测试中'
      }],
      grid: [{
        top: '11%',
        left: '2%',
        right: '10%',
      }],
      yAxis: [{
        inverse: true,
        min: -100,
        max: 4600,
        type: 'value',
        boundaryGap: false,
        show: false,

        splitLine: {
          show: false
        }
      }],
      xAxis: [{
        position: 'top',
        verticalAlign: 'top',
        axisLine: {
          show: false
        },
        axisTick: {
          show: false
        },
        type: 'category',
        data: ['1号线\n工学院方向',
          '1号线\n欣园方向',
          '2号线\n科研楼方向',
          '2号线\n欣园方向'],
        splitLine: {
          show: false
        }

      }],
      series: [{
        type: 'scatter',
        label: {
          fontSize: 10,
          show: true,
          color: '#999',
          position: 'right',
          formatter: '{b}'
        },
        data: []
      }, {
        type: 'lines',
        coordinateSystem: 'cartesian2d',
        data: [
        ]
      }, {
        label: {
          fontSize: 11,
          show: true,

          position: 'right',
          formatter: '{b}'
        },
        type: 'scatter',
        name: 'bus',
        data: [
        ]
      }
      ]
    })

  }, [])


  //加载线路与站点信息
  useEffect(() => {
    axios.get('data/line1.json').then(responseline1 => {
      axios.get('data/line2.json').then(responseline2 => {
        axios.get('data/stop1.json').then(responsestop1 => {
          axios.get('data/stop2.json').then(responsestop2 => {
            const line1data = responseline1.data
            const line2data = responseline2.data
            const stop1data = responsestop1.data
            const stop2data = responsestop2.data
            setLines([line1data, line2data])
            const line1dir1 = stop1data.features.map(f => {
              return {
                value: [1, turf.nearestPointOnLine(line1data['features'][0], f).properties.location * 1000],
                name: f.properties.name, itemStyle: { color: '#ff881b' }
              }
            })
            const line1dir2 = stop1data.features.map(f => {
              return {
                value: [0, turf.length(line1data['features'][0]) * 1000 - turf.nearestPointOnLine(line1data['features'][0], f).properties.location * 1000],
                name: f.properties.name, itemStyle: { color: '#ff881b' }
              }
            })
            const line2dir1 = stop2data.features.map(f => {
              return {
                value: [3, turf.nearestPointOnLine(line2data['features'][0], f).properties.location * 1000],
                name: f.properties.name, itemStyle: { color: '#379ff4' }
              }
            })
            const line2dir2 = stop2data.features.map(f => {
              return {
                value: [2, turf.length(line2data['features'][0]) * 1000 - turf.nearestPointOnLine(line2data['features'][0], f).properties.location * 1000],
                name: f.properties.name, itemStyle: { color: '#379ff4' }
              }
            })
            setEchartsOption({
              series: [{
                data: [...line1dir1, ...line1dir2, ...line2dir1, ...line2dir2]
              }, {
                data: [
                  { coords: [[0, 0], [0, turf.length(line1data['features'][0]) * 1000]], lineStyle: { color: '#ff881b', width: 2 } },
                  { coords: [[1, 0], [1, turf.length(line1data['features'][0]) * 1000]], lineStyle: { color: '#ff881b', width: 2 } },
                  { coords: [[2, 0], [2, turf.length(line2data['features'][0]) * 1000]], lineStyle: { color: '#379ff4', width: 2 } },
                  { coords: [[3, 0], [3, turf.length(line2data['features'][0]) * 1000]], lineStyle: { color: '#379ff4', width: 2 } }
                ]
              }]
            })
          })
        })
      })
    })

  }, [])

  //更新车辆位置
  function updatebuspos() {
    if (lines.length > 0) {
      axios.get('https://bus.sustcra.com/api/v2/monitor_osm/').then(response => {
        const res = response.data
        const busdata = res.filter(f => f.time_rt - f.time_mt < 300).map(f => {
          //判断是在哪个方向上
          const mcp = turf.point([f.lng, f.lat])
          const thisline = lines[0]['features'][0]
          //线上最近点
          const p_nearest = turf.nearestPointOnLine(thisline, mcp)
          const p_nearest_loc = p_nearest.properties.location
          //线上最近点+1米处的点
          const p_next = turf.along(thisline, p_nearest_loc + 0.0001);
          //计算切线角度
          let bearing = turf.rhumbBearing(p_nearest, p_next);
          if (bearing < 0) {
            bearing += 360
          }
          //通过车辆方向角判断车辆行进方向
          let route_dir = 2
          if (((f.course - bearing) < 45) && ((f.course - bearing) > -45)) {
            route_dir = 1
            return {
              value: [route_dir, p_nearest_loc * 1000],
              name: bus_plate_hash[f.id].plate, itemStyle: { color: '#222' },
              symbol: 'image://https://bus.sustcra.com/bus-top-view.png',
              symbolSize: 30,
              symbolRotate: 180,
              speed: f.speed
            }
          } else if (((f.course - bearing) < -135) || ((f.course - bearing) > 135)) {
            route_dir = 0
            return {
              value: [route_dir, turf.length(thisline) * 1000 - p_nearest_loc * 1000],
              name: bus_plate_hash[f.id].plate, itemStyle: { color: '#222' },
              symbol: 'image://https://bus.sustcra.com/bus-top-view.png',
              symbolSize: 30,
              symbolRotate: 180,
              speed: f.speed
            }
          } else {
            //从历史信息里找到这辆车的信息
            return historybusdata.filter(p => p.name == bus_plate_hash[f.id].plate)[0]
          }

        }
        )
        sethistorybusdata(busdata)
        setEchartsOption({
          series: [{}, {}, { data: busdata }]
        })
      })
    }
  }

  useEffect(() => {
    updatebuspos()
  }, [lines])

  const [times, settimes] = useState(0)
  useInterval(() => {
    settimes(times + 1)
    //5秒校准一次正确位置
    if (times % 10 == 0) {
      updatebuspos()
    } else {
      //0.5秒通过速度推测一次车辆的位置
      const newdata = historybusdata.map(f => {
        if (typeof (f) != 'undefined') {
          return { ...f, value: [f.value[0], f.value[1] + f.speed * 1000 / 7200] }
        }
      })
      sethistorybusdata(newdata)
      setEchartsOption({
        series: [{}, {}, { data: newdata }]
      })
    }
  }, 500, { immediate: true });

  return (
    <div className='container'>
      <ReactECharts
        option={option}
        ref={mycharts}
        style={{ height: '844px', width: '375px' }}
      />
    </div >
  )
}


