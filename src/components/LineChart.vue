<template>
  <div ref="chartRef" style="width: 100%; height: 350px;"></div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts'

const props = defineProps({
  data: {
    type: Object,
    required: true
  }
})

const chartRef = ref(null)
let chartInstance = null

const initChart = () => {
  if (!chartRef.value) return
  
  chartInstance = echarts.init(chartRef.value)
  
  const option = {
    title: {
      text: props.data.title,
      left: 'center'
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'cross',
        label: {
          backgroundColor: '#6a7985'
        }
      }
    },
    legend: {
      data: props.data.series.map(item => item.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: props.data.xAxis
    },
    yAxis: {
      type: 'value'
    },
    series: props.data.series.map(item => ({
      name: item.name,
      type: 'line',
      stack: 'Total',
      smooth: true,
      lineStyle: {
        width: 0
      },
      showSymbol: false,
      areaStyle: {
        opacity: 0.8,
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          {
            offset: 0,
            color: 'rgba(58, 77, 233, 0.8)'
          },
          {
            offset: 1,
            color: 'rgba(58, 77, 233, 0.1)'
          }
        ])
      },
      emphasis: {
        focus: 'series'
      },
      data: item.data
    }))
  }
  
  chartInstance.setOption(option)
}

const updateChart = () => {
  if (chartInstance) {
    chartInstance.dispose()
    initChart()
  }
}

onMounted(() => {
  initChart()
  window.addEventListener('resize', () => {
    if (chartInstance) chartInstance.resize()
  })
})

watch(() => props.data, () => {
  updateChart()
}, { deep: true })
</script>