<template>
  <div class="custom-select" :tabindex="tabindex" @blur="open = false">
    <div class="selected" :class="{ open: open }" @click="open = !open">
      {{ selected }}
    </div>
    <div class="items" :class="{ selectHide: !open }">
      <div
        v-for="(option, i) of options"
        :key="i"
        @click=";(selected = option), (open = false), $emit('input', option)"
      >
        {{ option }}
      </div>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    options: {
      type: Array,
      required: true
    },
    default: {
      type: String,
      required: false,
      default: null
    },
    tabindex: {
      type: Number,
      required: false,
      default: 0
    }
  },
  data() {
    return {
      //selected: this.default ? this.default : this.options.length > 0 ? this.options[0] : null,
      open: false
    }
  },
  computed: {
    selected() {
      return this.default
        ? this.default
        : this.options.length > 0
        ? this.options[0]
        : null
    }
  },
  mounted() {
    // this.$emit("input", this.selected);
  }
}
</script>

<style scoped>
@import '../assets/scss/main.scss';
.custom-select {
  position: relative;
  width: 100%;
  text-align: left;
  outline: none;
  height: 37px;
  line-height: 35px;
}

.custom-select .selected {
  background-color: #fff;
  border-radius: 4px;
  border: 1px solid #b9b9b9;
  color: #111;
  padding-left: 0.75rem;
  cursor: pointer;
  user-select: none;
  font-weight: 600;
}

.custom-select .selected.open {
  border: 1px solid #a9a9a9;
  border-radius: 4px 4px 0px 0px;
}

.custom-select .selected:after {
  position: absolute;
  content: '';
  top: 15px;
  right: 1em;
  width: 0;
  height: 0;
  border: 5px solid transparent;
  border-color: #000000 transparent transparent transparent;
}

.custom-select .items {
  color: #fff;
  border-radius: 0px 0px 4px 4px;
  overflow: hidden;
  /* border-right: 1px solid #333;
  border-left: 1px solid #333;
  border-bottom: 1px solid #333; */
  position: absolute;
  background-color: #ffffff;
  width: 100%;
  left: 0;
  right: 0;
  z-index: 99999;
  box-shadow: 1px 1px 10px #00000024;
}

.custom-select .items div {
  color: #111;
  padding-left: 1em;
  cursor: pointer;
  user-select: none;
}

.custom-select .items div:hover {
  background-color: #e0e0e0;
}

.selectHide {
  display: none;
}
</style>
