<template>
  <main class="tile is-ancestor is-vertical m-0 columns is-centered">
    <div class="tile is-parent">
      <div class="tile is-child box">
        <div class=" field has-addons">
          <div class="control">
            <span class="button is-static">Среднее 1:</span>
          </div>

          <div class="control">
            <input class="input" v-model="lambda1" type="number" placeholder="λ" min="0" increment="0.5"/>
          </div>

          <div class="control">
            <span class="button is-static">Среднее 2:</span>
          </div>

          <div class="control">
            <input class="input" v-model="lambda2" type="number" placeholder="λ" min="0" increment="0.5"/>
          </div>
        </div>
        <div class=" field has-addons">
          <div class="control">
            <span class="button is-static">Продолжительность эксперимента:</span>
          </div>

          <div class="control">
            <input class="input" v-model="T" type="number" placeholder="T" min="0"/>
          </div>

          <div class="control">
            <span class="button is-static">Длина интервала:</span>
          </div>

          <div class="control">
            <input class="input" v-model="interval" type="number" placeholder="interval" min="0"/>
          </div>

          <div class="control">
            <button class="button is-primary" @click="calculate">
              Запуск
            </button>
          </div>
        </div>
      </div>
    </div>
    <div class="tile is-parent">
      <div class="tile is-child panel">
        <p class="panel-heading">
          Продолжительность = {{ calculated.T }}; Длина интервала = {{calculated.interval}}<br/>
          λ1 = {{ calculated.lambda1 }}; λ2 = {{ calculated.lambda2 }}
        </p>
        <div class="panel-block">
          <h2>
            Среднее: {{ format(calculated.average) }}
            ({{ format(Math.abs(calculated.average - calculated.mean) / calculated.mean * 100) }}%)
          </h2>
        </div>
        <div class="panel-block">
          <h2>
            Дисперсия: {{ format(calculated.empiricVariance) }}
            ({{ format(Math.abs(calculated.variance - calculated.empiricVariance) / calculated.variance * 100) }}%)
          </h2>
        </div>
        <div class="panel-block">
          <h2>
            {{
              calculated.chiSquare > Approximate(0.05, calculated.arr.length)
                  ? `Хи-квадрат: ${format(calculated.chiSquare)} > ${format(Approximate(0.05, calculated.arr.length))}`
                  : `Хи-квадрат: ${format(calculated.chiSquare)} < ${format(Approximate(0.05, calculated.arr.length))}`
            }}
          </h2>
        </div>
        <div class="panel-block" v-for="tuple of calculated.arr" v-if="tuple !== undefined">
          <b-progress class="container" :value="tuple.x * 100.0 / calculated.max" show-value>
            {{ tuple.i }} | {{ tuple.x }} | {{ tuple.x / calculated.N }}
          </b-progress>
        </div>
      </div>
    </div>
  </main>
</template>

<script lang="ts">
import Vue from "vue";
import {getDt, getProbability} from "./PPP";

export default Vue.extend({
  data() {
    return {
      lambda1: 5,
      lambda2: 5,
      T: 1000,
      interval: 10,
      calculated: {
        arr: [] as ({ i:number, x:number } | undefined)[],
        T: 0,
        interval: 0,
        max: 0,
        N: 0,
        lambda1: 0,
        lambda2: 0,
        mean: 0,
        average: 0,
        variance: 0,
        empiricVariance: 0,
        chiSquare: 0
      }
    }
  },
  methods: {
    calculate() {
      if (typeof this.lambda1 === "string")
        this.lambda1 = Number.parseFloat(this.lambda1 as unknown as string)

      if (typeof this.lambda2 === "string")
        this.lambda2 = Number.parseFloat(this.lambda2 as unknown  as string)

      let res: ({ i:number, x:number } | undefined)[] = []
      let t = 0;
      let t1 = getDt(this.lambda1);
      let t2 = getDt(this.lambda2);
      let n = 0;
      let interval = 0

      while (t < this.T) {
        if (t1 < t2) {
          t += t1
          t2 -= t1
          interval += t1
          while (interval > this.interval) {
            if(res[n] === undefined) res[n] = {i:n, x:0}
            res[n]!.x++
            interval -= this.interval
            n = 0
          }
          n++
          t1 = getDt(this.lambda1)
        } else {
          t += t2
          t1 -= t2
          interval += t2
          while (interval > this.interval) {
            if(res[n] === undefined) res[n] = {i:n, x:0}
            res[n]!.x++
            interval -= this.interval
            n = 0
          }
          n++
          t2 = getDt(this.lambda2)
        }
      }

      let max = 0;
      let N = 0;
      for (let x of res) {
        if (x !== undefined) {
          N += x.x
          if(x.x > max) max = x.x
        }
      }

      let mean = (this.lambda1 + this.lambda2) * this.interval
      let average = 0
      for (let i = 0; i < res.length; i++) {
        average += (res[i]?.x || 0) / N * i
      }

      let variance = (this.lambda1 + this.lambda2) * this.interval
      let empiricVariance = 0
      for (let i = 0; i < res.length; i++) {
        empiricVariance += (res[i]?.x || 0) / N * Math.pow(i - average, 2)
      }

      let chiSquare = -N
      for (let i = 0; i < res.length; i++) {
        chiSquare += (res[i]?.x || 0) * (res[i]?.x || 0)
            / getProbability(i, this.interval, this.lambda1 + this.lambda2) / N
      }

      this.calculated.max = max
      this.calculated.arr = res
      this.calculated.T = this.T
      this.calculated.lambda1 = this.lambda1
      this.calculated.lambda2 = this.lambda2
      this.calculated.mean = mean
      this.calculated.average = average
      this.calculated.variance = variance
      this.calculated.empiricVariance = empiricVariance
      this.calculated.chiSquare = chiSquare
      this.calculated.interval = this.interval
      this.calculated.N = N;
    },
    format: new Intl.NumberFormat("ru-RU", {
      maximumFractionDigits: 2
    }).format,
    Approximate(alpha: number, k: number)
    {
      alpha = 1 - alpha
      // https://ru.wikipedia.org/wiki/%D0%9A%D0%B2%D0%B0%D0%BD%D1%82%D0%B8%D0%BB%D0%B8_%D1%80%D0%B0%D1%81%D0%BF%D1%80%D0%B5%D0%B4%D0%B5%D0%BB%D0%B5%D0%BD%D0%B8%D1%8F_%D1%85%D0%B8-%D0%BA%D0%B2%D0%B0%D0%B4%D1%80%D0%B0%D1%82
      let n = k - 1
      let d = 0
      if (alpha >= 0.5 && alpha < 1) {
        d = 2.0637 * Math.pow(Math.log(1 / (1 - alpha)) - 0.16, 0.4274) - 1.5774
      }
      else if (alpha >= 0.001 && alpha < 0.5) {
        d = -2.0637 * Math.pow(Math.log(1 / alpha) - 0.16, 0.4274) + 1.5774
      }

      let A = d * Math.sqrt(2)
      let B = 2.0 / 3 * (d * d - 1)
      let C = d * (d * d - 7) / 9 / Math.sqrt(2)
      let D = (6 * Math.pow(d, 4) + 14 * d * d - 32) / 405
      let E = d * (9 * Math.pow(d, 4) + 256 * d * d - 433) / 4860 / Math.sqrt(2)
      return n + A * Math.sqrt(n) + B + C / Math.sqrt(n) + D / n + E / n / Math.sqrt(n)
    }
  }
});
</script>