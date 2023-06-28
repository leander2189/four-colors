class FourColors
{
	constructor(canvasId, colors) 
	{
        this.PaintColors = colors;
        this.PaintCol = -1;
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext("2d", { willReadFrequently: true});
        this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas.addEventListener('mouseout', this.handleMouseLeave.bind(this));
        this.canvas.addEventListener('click', this.handleMouseClick.bind(this));

        // init
        /*
        this.clock = setInterval(function(t0){
            var now = new Date().getTime();
            var passed = now - t0;

            var timer = document.getElementById('timer');
            timer.innerHTML = passed / 1000;

        }, 1000, this.timeInit);
        */

	}

    init(N)
    {
        var w = this.canvas.width;
        var h = this.canvas.height;

        this.n = N;
        var positions = Float64Array.from({length: this.n * 2}, (_, i) => Math.random() * (i & 1 ? h : w))
        this.voronoi = new d3.Delaunay(positions).voronoi([0, 0, w, h])
        this.selected = null;

        // Init color array
        this.colors = Array(this.n);
        for (var i = 0; i < this.n; i++) this.colors[i] = 0;
        this.error = Array(this.n);
        for (var i = 0; i < this.n; i++) this.error[i] = false;

        this.timeInit = new Date().getTime();
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
    
    handleMouseLeave(event)
    {
        this.selected = null;
        this.draw();
    }

    draw()
    {
        this.checkErrors();

        // Print cells
        this.ctx.lineWidth = 1;
        for (var i = 0; i < this.n; i++)
        {
            this.ctx.fillStyle = this.PaintColors[this.colors[i]];
            if (this.error[i]) this.ctx.strokeStyle = 'red';
            else this.ctx.strokeStyle = 'black';
            this.ctx.beginPath();
            this.voronoi.renderCell(i, this.ctx);
            this.ctx.stroke();
            this.ctx.fill();
        }

        // Print selected
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
            this.colors[this.selected] = this.PaintCol;

        this.draw();

        var finished = this.checkComplete();
        if (finished)
        {
            // Throw event for finish popup
            var totalTime = (new Date().getTime() - this.timeInit)/1000.0;
            console.log(totalTime);
            event = new CustomEvent("finished", { detail: totalTime });
            this.canvas.dispatchEvent(event);
        }
    }

    checkErrors()
    {
        for (var i = 0; i < this.n; i++)
        {
            var neighbors = this.voronoi.neighbors(i);
            var error = false;
            
            if (this.colors[i] > 0)
            {
                for (const k of neighbors)
                {
                    if (this.colors[i] == this.colors[k])
                        error = true;
                }
            }
            
            this.error[i] = error;
        }
    }

    checkComplete()
    {
        var everythingPainted = true;
        this.colors.forEach(x => {
            if (x == 0) everythingPainted = false;
        });

        this.checkErrors();
        var noErrors = true;
        this.error.forEach(x => {
            if (x == true) noErrors = false;
        });

        return everythingPainted && noErrors;
    }

    addEventListener(event, listener) {
        this.canvas.addEventListener(event, listener);
    }
}
