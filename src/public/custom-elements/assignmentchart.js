import Chart from 'chart.js/auto';

class ChartElem extends HTMLElement {
    constructor() {
        super();
    }
    
    static get observedAttributes() {
        return ['chart-data', 'y-max'];
    }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'chart-data') {
            this.chartData = newValue;
        } else if (name === 'y-max') {
            this.yMax = newValue;
        }
    }

    get chartData() {
        return this._chartData;
    }

    set chartData(d) {
        this._chartData = JSON.parse(d);
        sessionStorage.setItem('chartData', d);
        if (this._connected) {
            this.render(true);
        }
    }

    get yMax() {
        return this._yMax;
    }

    set yMax(d) {
        this._yMax = d
        if (this._connected) {
            console.log('2');
            this.render(true, d);
        }
    }

    connectedCallback() {
        this._shadow = this.attachShadow({ mode: 'open' });
        this._root = document.createElement('canvas');
        this._root.setAttribute("id", "myChart");
        this._root.setAttribute("style", "width: 100%");
        this._shadow.appendChild(this._root);
        this._parent = document.querySelector("chart-elem");

        this._parent.style.display = "block";

        let savedData = sessionStorage.getItem('chartData');
        if (savedData && savedData !== 'undefined' && !this._chartData)
            this._chartData = savedData;
        this._connected = true;
        if (this._yMax) {
            console.log('3');
            this.render(true, this._yMax);
        }
        if (this._chartData) {
            this.render();
        }
    }

    render(chartUpdate, yMax) {
        const ctx = this._shadow.getElementById('myChart').getContext('2d');
        Chart.defaults.font.family = "Avenir";
        Chart.defaults.font.size = 16;
        Chart.defaults.font.weight = "bold";
        /*
            this.chartData = {
                label: 'Placeholder',
                data: []
            }
        */
        if (chartUpdate) {
            let chartStatus = Chart.getChart(ctx); // <canvas> id
            if (chartStatus != undefined) {
                chartStatus.destroy();
            }
        }
        let chartObj = {
            type: 'bar',
            data: this.chartData,
            options: {
                maintainAspectRatio: false,
                legend: {
                    display: false
                },
                scales: {
                    y: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            beginAtZero: true,
                        },
                        stacked: true,
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        stacked: true
                    }
                },
                plugins: {
                    tooltip: {
                        callbacks: {
                            /*
                            title: function (tooltipItems) {
                                let title = tooltipItems[0].label || '';
                                if (title !== "Now") {
                                    title = `Year ${title}`;
                                }
                                return title;
                            },
                            label: function (context) {
                                let label = context.dataset.label || '';

                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(context.parsed.y);
                                }
                                return label;
                            },
                            footer: function (tooltipItems) {
                                let total = 0;
                                for (let i = 0; i < 3; i++) {
                                    if (tooltipItems[0].parsed._stacks.y[i]) {
                                        total += tooltipItems[0].parsed._stacks.y[i];
                                    }
                                }
                                total = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(total);
                                return 'Total: ' + total;
                            }
                            */
                        }
                    }
                }
            },
        };
        if (yMax) {
            chartObj.options.scales.y.max = 100;
        }
        const myChart = new Chart(ctx, chartObj);
    }
}

window.customElements.define('chart-elem', ChartElem);