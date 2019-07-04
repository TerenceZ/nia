import Vue, { ComponentOptions } from "vue";
import { RootModel } from "./model";

declare module "vue/types/vue" {
  interface Vue {
    $: RootModel;
  }
}

declare module "vue/types/options" {
  interface ComponentOptions<V extends Vue> {
    $?: RootModel;
  }
}
