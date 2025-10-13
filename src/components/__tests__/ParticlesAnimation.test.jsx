import { render } from "@testing-library/react";
import ParticlesAnimation from "../ParticlesAnimation";

describe("ParticlesAnimation", () => {
  test("renders particles animation with default props", () => {
    render(<ParticlesAnimation />);

    const svg = document.querySelector("#svg-global");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "400");
    expect(svg).toHaveAttribute("height", "300");
  });

  test("renders with custom dimensions", () => {
    render(<ParticlesAnimation width={600} height={400} />);

    const svg = document.querySelector("#svg-global");
    expect(svg).toHaveAttribute("width", "600");
    expect(svg).toHaveAttribute("height", "400");
  });

  test("renders with custom className", () => {
    render(<ParticlesAnimation className="custom-class" />);

    const container = document.querySelector(".custom-class");
    expect(container).toBeInTheDocument();
  });

  test("renders background when showBackground is true", () => {
    render(<ParticlesAnimation showBackground={true} />);

    const background = document.querySelector(".bg-gradient-to-br");
    expect(background).toBeInTheDocument();
  });

  test("does not render background when showBackground is false", () => {
    render(<ParticlesAnimation showBackground={false} />);

    const background = document.querySelector(".bg-gradient-to-br");
    expect(background).not.toBeInTheDocument();
  });

  test("renders SVG with correct structure", () => {
    render(<ParticlesAnimation />);

    const svg = document.querySelector("#svg-global");
    expect(svg).toBeInTheDocument();
    expect(svg.tagName).toBe("svg");

    const lines = document.querySelector("#lines");
    expect(lines).toBeInTheDocument();

    const panel = document.querySelector("#panel-rigth");
    expect(panel).toBeInTheDocument();

    const node = document.querySelector("#node-server");
    expect(node).toBeInTheDocument();
  });

  test("renders particles group", () => {
    render(<ParticlesAnimation />);

    const particles = document.querySelector("#particles");
    expect(particles).toBeInTheDocument();
  });
});
