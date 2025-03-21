<template>
  <!-- C'est ici qu'on met le HTML -->
  <div class="hello">
    <h1>{{ message }}</h1>
    <button @click="sayHello">Cliquez-moi</button>
  </div>
</template>

<script>
// C'est ici qu'on met la logique JavaScript
export default {
  data() {
    return {
      message: 'Bonjour!'
    }
  },
  methods: {
    sayHello() {
      alert(this.message)
    }
  }
}
</script>

<style>
/* C'est ici qu'on met le CSS */
.hello {
  color: blue;
}
</style>
