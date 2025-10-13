import React, { useEffect, useState } from "react";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";

export default function TableView() {
  const [rows, setRows] = useState([]);
  const [columns, setColumns] = useState([]);
  useEffect(() => {
  axios.get("/api/rows").then((res) => {
    const data = res.data;

    // Assign a unique 'id' for DataGrid (required)
    const rowsWithId = data.map((row, index) => ({
      id: row.id ?? index, // use row.id if available, otherwise index
      ...row
    }));

    setRows(rowsWithId);

    if (data.length > 0) {
      // Convert object keys to DataGrid columns
      const cols = Object.keys(data[0]).map((key) => ({
        field: key,
        headerName: key.charAt(0).toUpperCase() + key.slice(1),
        width: 200,
        editable: key !== "id",
      }));
      setColumns(cols);
    }
  });
}, []);


{/*useEffect(() => {
    // static test data
    const testData = [
      { id: 1, name: "Robert BSD", type: "Outgoing Call" },
      { id: 2, name: "Benedikt Bartsch", type: "Missed Call" },
    ];

    setRows(testData);

    setColumns([
      { field: "id", headerName: "ID", width: 100 },
      { field: "name", headerName: "Name", width: 200, editable: true },
      { field: "type", headerName: "Type", width: 200, editable: true },
    ]);
  }, []);*/}

  const handleCellEditCommit = (params) => {
    alert(1);
    const updatedRows = rows.map((row) =>
      row.id === params.id ? { ...row, [params.field]: params.value } : row
    );
    setRows(updatedRows);
    console.log(`update /api/rows/${params.id}`);

    // send update to server
    axios.put(`/api/rows/${params.id}`, {
      column: params.field,
      value: params.value,
    });
  };

  return (
    <div style={{ height: "100%", width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        onCellEditCommit={handleCellEditCommit}
      />
    </div>
  );
}

