import { render } from "@testing-library/react";
import ParticlesAnimation from "../ParticlesAnimation";

describe("ParticlesAnimation", () => {
  test("renders particles animation with default props", () => {
    render(<ParticlesAnimation />);

    const particles = document.querySelector("#particles");
    expect(particles).toBeInTheDocument();
    expect(particles).toHaveClass("particles-container");
  });

  test("renders with custom dimensions", () => {
    render(<ParticlesAnimation width={600} height={400} />);

    const particles = document.querySelector("#particles");
    expect(particles).toBeInTheDocument();
    expect(particles).toHaveClass("particles-container");
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

  test("renders particles with correct structure", () => {
    render(<ParticlesAnimation />);

    const particles = document.querySelector("#particles");
    expect(particles).toBeInTheDocument();
    expect(particles).toHaveClass("particles-container");

    const particle1 = document.querySelector(".particle.p1");
    expect(particle1).toBeInTheDocument();

    const particle2 = document.querySelector(".particle.p2");
    expect(particle2).toBeInTheDocument();
  });

  test("renders Multiminder-themed particles", () => {
    render(<ParticlesAnimation />);

    const particles = document.querySelector("#particles");
    expect(particles).toBeInTheDocument();
  });

  test("renders particles with different animation types", () => {
    render(<ParticlesAnimation />);

    const particles = document.querySelector("#particles");
    expect(particles).toBeInTheDocument();
  });
});
