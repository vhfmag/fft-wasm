class Complex {
    constructor(public re: number, public im: number) {}
    
    abs() {
        return (this.re ** 2 + this.im ** 2) ** 0.5;
    }

	add(other: Complex, dst: Complex) {
		dst.re = this.re + other.re;
		dst.im = this.im + other.im;
		return dst;
	}
	sub(other: Complex, dst: Complex) {
		dst.re = this.re - other.re;
		dst.im = this.im - other.im;
		return dst;
	}
	mul(other: Complex, dst: Complex) {
		//cache re in case dst === this
		var r = this.re * other.re - this.im * other.im;
		dst.im = this.re * other.im + this.im * other.re;
		dst.re = r;
		return dst;
	}
	cexp(dst: Complex) {
		var er = Math.exp(this.re);
		dst.re = er * Math.cos(this.im);
		dst.im = er * Math.sin(this.im);
		return dst;
	}
	log() {
		/*
        although 'It's just a matter of separating out the real and imaginary parts of jw.' is not a helpful quote
        the actual formula I found here and the rest was just fiddling / testing and comparing with correct results.
        http://cboard.cprogramming.com/c-programming/89116-how-implement-complex-exponential-functions-c.html#post637921
        */
		if (!this.re) console.log(this.im.toString() + "j");
		else if (this.im < 0) console.log(this.re.toString() + this.im.toString() + "j");
		else console.log(this.re.toString() + "+" + this.im.toString() + "j");
	}
}

function monomorphicFFT(amplitudes: Complex[]): Complex[] {
	var N = amplitudes.length;
	if (N <= 1) return amplitudes;

	var hN = Math.trunc(N / 2);
	var even = [];
	var odd = [];
	even.length = hN;
	odd.length = hN;
	for (var i = 0; i < hN; ++i) {
		even[i] = amplitudes[i * 2];
		odd[i] = amplitudes[i * 2 + 1];
	}
	even = fft(even);
	odd = fft(odd);

	var a = -2 * Math.PI;
	for (var k = 0; k < hN; ++k) {
		var p = k / N;
		var t = new Complex(0, a * p);
		t.cexp(t).mul(odd[k], t);
		amplitudes[k] = even[k].add(t, odd[k]);
		amplitudes[k + hN] = even[k].sub(t, even[k]);
	}
	return amplitudes;
}

export function fft(as: Array<Complex | number> | Float32Array | Float64Array): Complex[] {
	return monomorphicFFT([...as].map(x => (x instanceof Complex ? x : new Complex(x, 0))));
}
