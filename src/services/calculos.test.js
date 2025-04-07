import calcularImpuestos, { calcularAportesBPS, calcularIPRF } from "./calculos";

describe("Probar cálculo de aportes BPS", () => {
  test.each([
    [1000, false, false, 150, 30, 1],
    [1000, true, false, 150, 30, 1],
    [1000, false, true, 150, 50, 1],
    [1000, true, true, 150, 50, 1],
    [20000, false, false, 3000, 900, 20],
    [20000, true, false, 3000, 1200, 20],
    [20000, false, true, 3000, 1300, 20],
    [20000, true, true, 3000, 1600, 20],
  ])(
    "Calcula aportes BPS correctamente",
    (salarioNominal, tieneHijos, tieneConyuge, esperadoJubilatorio, esperadoFONASA, esperadoFRL) => {
      const resultado = calcularAportesBPS(salarioNominal, tieneHijos, tieneConyuge);

      // Lo esperado deberia estar a un valor razonable de lo obtenido, para evitar errores de redondeo
      expect(resultado.aportesJubilatorios).toBeCloseTo(esperadoJubilatorio);
      expect(resultado.aportesFONASA).toBeCloseTo(esperadoFONASA);
      expect(resultado.aporteFRL).toBeCloseTo(esperadoFRL);
    }
  );

  test.each([
    [202693, 30404],
    [300000, 40884.6],
  ])("Aplican topes jubilatorios", (salarioNominal, esperadoJubilatorio) => {
    /**
     * El aporte jubilatorio se aplica hasta el tope 188411 (valor 2020).
     */
    const resultado = calcularAportesBPS(salarioNominal, false, false);

    // Lo esperado deberia estar a un valor razonable de lo obtenido, para evitar errores de redondeo
    expect(resultado.aportesJubilatorios).toBeCloseTo(esperadoJubilatorio, 1);
  });
});

describe("Probar cálculo de IRPF", () => {
  test.each([
    [20000, 1, 0, 0, 3000, 900, 20, 0, 0, 0, 0, { impuestoFranja: [0, 0, 0, 0, 0, 0, 0, 0], deducciones: 3920 }, 0],
    [50000, 1, 0, 0, 7500, 2250, 50, 0, 0, 0, 0, { impuestoFranja: [0, 397, 0, 0, 0, 0, 0, 0], deducciones: 9800 }, 0],
    [
      80000,
      1,
      0,
      0,
      12000,
      3600,
      80,
      0,
      0,
      0,
      0,
      { impuestoFranja: [0, 1973, 2856, 0, 0, 0, 0, 0], deducciones: 15680 },
      2634,
    ],
    [
      80000,
      1,
      1,
      0,
      12000,
      3600,
      80,
      0,
      0,
      0,
      0,
      { impuestoFranja: [0, 1973, 2856, 0, 0, 0, 0, 0], deducciones: 26640 },
      1099,
    ],
    [
      80000,
      1,
      0,
      1,
      12000,
      3600,
      80,
      0,
      0,
      0,
      0,
      { impuestoFranja: [0, 1973, 2856, 0, 0, 0, 0, 0], deducciones: 37600 },
      0,
    ],
    [
      80000,
      1,
      1,
      1,
      12000,
      3600,
      80,
      0,
      0,
      0,
      0,
      { impuestoFranja: [0, 1973, 2856, 0, 0, 0, 0, 0], deducciones: 48560 },
      0,
    ],
  ])(
    "Calcula IRPF correctamente",
    (
      salarioNominal,
      factorDeduccionPersonasACargo,
      cantHijosSinDiscapacidad,
      cantHijosConDiscapacidad,
      aportesJubilatorios,
      aportesFONASA,
      aporteFRL,
      aportesCJPPU,
      aportesFondoSolidaridad,
      adicionalFondoSolidaridad,
      otrasDeducciones,
      esperadoDetalleIRPF,
      esperadoTotalIRPF
    ) => {
      const resultado = calcularIPRF(
        salarioNominal,
        factorDeduccionPersonasACargo,
        cantHijosSinDiscapacidad,
        cantHijosConDiscapacidad,
        aportesJubilatorios,
        aportesFONASA,
        aporteFRL,
        aportesCJPPU,
        aportesFondoSolidaridad,
        adicionalFondoSolidaridad,
        otrasDeducciones
      );

      // Lo esperado deberia estar a un valor razonable de lo obtenido, para evitar errores de redondeo

      expect(resultado.detalleIRPF.impuestoFranja[0]).toBeCloseTo(esperadoDetalleIRPF.impuestoFranja[0]);
      expect(resultado.detalleIRPF.impuestoFranja[1]).toBeCloseTo(esperadoDetalleIRPF.impuestoFranja[1], -0.5);
      expect(resultado.detalleIRPF.impuestoFranja[2]).toBeCloseTo(esperadoDetalleIRPF.impuestoFranja[2], -0.5);
      expect(resultado.detalleIRPF.impuestoFranja[3]).toBeCloseTo(esperadoDetalleIRPF.impuestoFranja[3], -0.5);
      expect(resultado.detalleIRPF.impuestoFranja[4]).toBeCloseTo(esperadoDetalleIRPF.impuestoFranja[4], -0.5);
      expect(resultado.detalleIRPF.deducciones).toBeCloseTo(esperadoDetalleIRPF.deducciones, -0.5);
      expect(resultado.totalIRPF).toBeCloseTo(esperadoTotalIRPF, -0.5);
    }
  );
});

describe("Probar cálculo total", () => {
  test.each([[100, false, false, 1, 0, 0, 0, false, 0, 0, 82]])(
    "Calcula impuestos correctamente",
    (
      salarioNominal,
      tieneHijos,
      tieneConyuge,
      factorDeduccionPersonasACargo,
      cantHijosSinDiscapacidad,
      cantHijosConDiscapacidad,
      aportesFondoSolidaridad,
      adicionalFondoSolidaridad,
      aportesCJPPU,
      otrasDeducciones,
      esperadoSalarioLiquido
    ) => {
      const {
        salarioLiquido,
        aportesJubilatorios,
        aportesFONASA,
        aporteFRL,
        detalleIRPF,
        totalIRPF,
      } = calcularImpuestos(
        salarioNominal,
        tieneHijos,
        tieneConyuge,
        factorDeduccionPersonasACargo,
        cantHijosSinDiscapacidad,
        cantHijosConDiscapacidad,
        aportesFondoSolidaridad,
        adicionalFondoSolidaridad,
        aportesCJPPU,
        otrasDeducciones
      );

      expect(salarioLiquido).toBeCloseTo(esperadoSalarioLiquido, -0.5);
    }
  );
});
