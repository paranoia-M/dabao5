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
      trigger: 'item',
      formatter: '{a} <br/>{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'horizontal',
      bottom: 0,
      data: props.data.data.map(item => item.name)
    },
    series: [
      {
        name: '风险等级分布',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: '18',
            fontWeight: 'bold'
          }
        },
        labelLine: {
          show: false
        },
        data: props.data.data
      }
    ]
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