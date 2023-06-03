class FourColors
{
	constructor(canvasId, colors) 
	{
        this.PaintColors = colors;
        this.PaintCol = -1;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true});
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('click', this.handleMouseClick.bind(this));

        // init

        var w = this.canvas.width;
        var h = this.canvas.height;

        this.n = 30;

        var positions = Float64Array.from({length: this.n * 2}, (_, i) => Math.random() * (i & 1 ? h : w))

        this.voronoi = new d3.Delaunay(positions).voronoi([0, 0, w, h])

        this.selected = null;
        // Init color array
        this.colors = Array(this.n);
        for (var i = 0; i < this.n; i++)
            this.colors[i] = 'white';

        this.draw();
	}

    handleMouseMove(event) {
        const mouseX = event.clientX - this.canvas.offsetLeft;
        const mouseY = event.clientY - this.canvas.offsetTop;
      
        this.selected = null;
        for (var i = 0; i < this.n; i++)
        {
            if (this.voronoi.contains(i, mouseX, mouseY))
            {
                this.selected = i;
                break;
            }
        }

        this.draw();
      }

    draw()
    {
        this.ctx.lineWidth = 1;
        for (var i = 0; i < this.n; i++)
        {
            this.ctx.fillStyle = this.colors[i];
            this.ctx.beginPath();
            this.voronoi.renderCell(i, this.ctx);
            this.ctx.stroke();
            this.ctx.fill();
        }

        if (this.selected != null)
        {
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.voronoi.renderCell(this.selected, this.ctx);
            this.ctx.stroke();
        }
        
    }

    handleMouseClick(event)
    {
        if (this.selected != null && this.PaintCol > -1)
            this.colors[this.selected] = this.PaintColors[this.PaintCol];


        this.draw();
    }
}
