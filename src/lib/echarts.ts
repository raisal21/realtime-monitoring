// ECharts bootstrap: registers the minimum chart/component/renderer surface
// used by the dashboard. All chart consumers import `echarts` + `EChartsOption`
// from here and pass `echarts={echarts}` to <ReactECharts /> from
// "echarts-for-react/lib/core" so the full ECharts bundle is never pulled in.

import * as echarts from "echarts/core";
import { LineChart, CustomChart, GaugeChart } from "echarts/charts";
import {
  GridComponent,
  TooltipComponent,
  AxisPointerComponent,
  DataZoomComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  LineChart,
  CustomChart,
  GaugeChart,
  GridComponent,
  TooltipComponent,
  AxisPointerComponent,
  DataZoomComponent,
  CanvasRenderer,
]);

export { echarts };
export type { EChartsOption } from "echarts";
