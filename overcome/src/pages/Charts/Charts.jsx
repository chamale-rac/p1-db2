import React from 'react'
import * as styles from './Charts.module.css'

const Charts = () => {
  return (
    <div className={`${styles.container}`}>
      <h2 className={`${styles.title} font-bebas-neue`}>Charts 🔥</h2>
      <div className={styles.content_container}>
        <iframe
          className={styles.mongoIframe}
          width="640"
          height="480"
          src="https://charts.mongodb.com/charts-overcomefinal-xecrs/embed/charts?id=65e37437-8ad7-4007-8860-7a30b86a083b&maxDataAge=3600&theme=light&autoRefresh=true"
        ></iframe>
        <iframe
          className={styles.mongoIframe}
          width="640"
          height="480"
          src="https://charts.mongodb.com/charts-overcomefinal-xecrs/embed/charts?id=65e375b4-fb81-4534-8418-d253fb11792f&maxDataAge=3600&theme=light&autoRefresh=true"
        ></iframe>
        <iframe
          className={styles.mongoIframe}
          width="640"
          height="480"
          src="https://charts.mongodb.com/charts-overcomefinal-xecrs/embed/charts?id=65e37794-fcdd-4114-835a-e9e912a8b5fd&maxDataAge=3600&theme=light&autoRefresh=true"
        ></iframe>
      </div>
    </div>
  )
}

export default Charts
