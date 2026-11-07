// Deja cualquier respuesta de lista en la forma del contrato:
// { content, page, size, totalElements, totalPages } (página base 0).
// También tolera las formas viejas de los mocks de la Fase I ({ items,
// totalRecords, pageSize }, { resultados } o un arreglo suelto) para que un
// mock de APIM sin actualizar no rompa la pantalla.
export function normalizarPagina(res, size, pagePedida = 0) {
  const nuevo = res && typeof res === "object" && !Array.isArray(res) && Array.isArray(res.content);
  const content = Array.isArray(res)
    ? res
    : Array.isArray(res?.content)
      ? res.content
      : Array.isArray(res?.items)
        ? res.items
        : Array.isArray(res?.resultados)
          ? res.resultados
          : [];
  const tam = (nuevo ? res.size : res?.pageSize ?? res?.size) || size;
  const totalElements = res?.totalElements ?? res?.totalRecords ?? content.length;
  return {
    content,
    page: nuevo ? res.page ?? pagePedida : pagePedida,
    size: tam,
    totalElements,
    totalPages: res?.totalPages ?? Math.ceil(totalElements / tam),
  };
}
