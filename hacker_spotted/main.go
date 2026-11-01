// hacker_spotted serves a web page that draws a "bug" out of digits,
// neon green on a black background.
package main

import (
	"flag"
	"html/template"
	"log"
	"math"
	"math/rand"
	"net/http"
	"strings"
)

const (
	cols = 100 // characters per row
	rows = 55  // rows (chars are ~0.55 as wide as a line is tall, so this is roughly square)
)

type point struct{ x, y float64 }

// The bug is described in a 100x100 space.
type ellipse struct{ cx, cy, rx, ry float64 }

var blobs = []ellipse{
	{50, 25, 10, 8},  // head
	{50, 39, 21, 6},  // shoulders
	{50, 61, 21, 24}, // body
}

// Legs and antennae as poly-lines (left side; mirrored for the right side).
var limbs = [][]point{
	{{45, 19}, {41, 12}, {36, 11}},           // antenna
	{{32, 38}, {20, 38}, {15, 32}},           // front leg
	{{31, 55}, {20, 54}, {11, 55}},           // middle leg
	{{33, 70}, {25, 77}, {22, 86}, {21, 91}}, // back leg
}

const limbWidth = 2.4

func inEllipse(p point, e ellipse) bool {
	dx, dy := (p.x-e.cx)/e.rx, (p.y-e.cy)/e.ry
	return dx*dx+dy*dy <= 1
}

func distToSegment(p, a, b point) float64 {
	vx, vy := b.x-a.x, b.y-a.y
	t := ((p.x-a.x)*vx + (p.y-a.y)*vy) / (vx*vx + vy*vy)
	t = math.Max(0, math.Min(1, t))
	dx, dy := p.x-(a.x+t*vx), p.y-(a.y+t*vy)
	return math.Hypot(dx, dy)
}

func onLimb(p point) bool {
	for _, side := range []bool{false, true} {
		for _, l := range limbs {
			for i := 0; i+1 < len(l); i++ {
				a, b := l[i], l[i+1]
				if side {
					a.x, b.x = 100-a.x, 100-b.x
				}
				if distToSegment(p, a, b) <= limbWidth {
					return true
				}
			}
		}
	}
	return false
}

// inside reports whether a point is part of the bug.
func inside(p point) bool {
	// thin split down the back of the body, like beetle wings
	if p.y > 44 && p.y < 82 && math.Abs(p.x-50) < 0.7 {
		return false
	}
	for _, e := range blobs {
		if inEllipse(p, e) {
			return true
		}
	}
	return onLimb(p)
}

// cell is one character on the screen.
type cell struct {
	Ch    string
	Class string
}

func buildArt(r *rand.Rand) [][]cell {
	art := make([][]cell, rows)
	for y := 0; y < rows; y++ {
		line := make([]cell, cols)
		for x := 0; x < cols; x++ {
			p := point{(float64(x) + 0.5) * 100 / cols, (float64(y) + 0.5) * 100 / rows}
			d := string(rune('0' + r.Intn(10)))
			switch {
			case inside(p):
				// mix of brightness levels gives the glowing, layered look
				switch n := r.Float64(); {
				case n < 0.08:
					line[x] = cell{" ", ""}
				case n < 0.40:
					line[x] = cell{d, "b1"}
				case n < 0.80:
					line[x] = cell{d, "b2"}
				default:
					line[x] = cell{d, "b3"}
				}
			case r.Float64() < 0.05:
				line[x] = cell{d, "bg"} // faint background noise
			default:
				line[x] = cell{" ", ""}
			}
		}
		art[y] = line
	}
	return art
}

// render turns the grid into HTML spans (one span per character run of the same class).
func render(art [][]cell) template.HTML {
	var sb strings.Builder
	for _, line := range art {
		for _, c := range line {
			if c.Class == "" {
				sb.WriteString(c.Ch)
				continue
			}
			sb.WriteString(`<span class="` + c.Class + `">` + c.Ch + `</span>`)
		}
		sb.WriteString("\n")
	}
	return template.HTML(sb.String())
}

var page = template.Must(template.New("page").Parse(`<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hacker Spotted</title>
<style>
  html, body { margin: 0; height: 100%; background: #000; }
  body { display: flex; align-items: center; justify-content: center; overflow: hidden; }
  pre {
    margin: 0;
    font-family: "Courier New", Consolas, monospace;
    font-weight: bold;
    /* fit 100 cols x 55 rows inside the window */
    font-size: min(1.6vw, 1.55vh);
    line-height: 1.1;
    color: #39ff14;
    user-select: none;
  }
  .b1 { color: #1fa80f; text-shadow: 0 0 2px #1fa80f; }
  .b2 { color: #39ff14; text-shadow: 0 0 4px #39ff14; }
  .b3 { color: #c8ffb8; text-shadow: 0 0 6px #39ff14, 0 0 12px #39ff14; }
  .bg { color: #0b4d06; }
</style>
</head>
<body>
<pre id="art">{{.}}</pre>
<script>
  // Keep the digits flickering like a live data stream.
  const spans = document.querySelectorAll('#art span');
  setInterval(() => {
    for (let i = 0; i < 60; i++) {
      const s = spans[Math.floor(Math.random() * spans.length)];
      s.textContent = Math.floor(Math.random() * 10);
    }
  }, 60);
</script>
</body>
</html>
`))

func main() {
	addr := flag.String("addr", ":8080", "address to listen on")
	flag.Parse()

	http.HandleFunc("/", func(w http.ResponseWriter, req *http.Request) {
		art := buildArt(rand.New(rand.NewSource(rand.Int63())))
		w.Header().Set("Content-Type", "text/html; charset=utf-8")
		if err := page.Execute(w, render(art)); err != nil {
			log.Println(err)
		}
	})

	log.Printf("hacker_spotted running on http://localhost%s", *addr)
	log.Fatal(http.ListenAndServe(*addr, nil))
}
