// Funkcja do ładowania danych z localStorage
function loadMeasurements() {
    const measurements = localStorage.getItem('bloodPressureMeasurements');
    return measurements ? JSON.parse(measurements) : [];
}

// Funkcja do zapisywania danych do localStorage
function saveMeasurements(measurements) {
    localStorage.setItem('bloodPressureMeasurements', JSON.stringify(measurements));
}

// Funkcja do eksportu bazy do pliku JSON (automatycznie po każdym zapisie)
function exportDatabaseToJson(measurements) {
    const jsonContent = JSON.stringify(measurements, null, 2); // Formatowany JSON
    const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `baza_pomiarow_cisnienia_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Funkcja do wyświetlania listy pomiarów
function displayMeasurements(measurements) {
    const list = document.getElementById('measurementsList');
    list.innerHTML = '';
    
    if (measurements.length === 0) {
        list.innerHTML = '<li>Brak zapisanych pomiarów.</li>';
        return;
    }
    
    measurements.forEach((measurement, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${measurement.date}</strong>: ${measurement.systolic}/${measurement.diastolic} mmHg
            <button onclick="deleteMeasurement(${index})">Usuń</button>
        `;
        list.appendChild(li);
    });
}

// Funkcja do usuwania pomiaru
function deleteMeasurement(index) {
    const measurements = loadMeasurements();
    measurements.splice(index, 1);
    saveMeasurements(measurements);
    displayMeasurements(measurements);
    alert('Pomiar został usunięty. Aby zaktualizować plik bazy, użyj przycisku importu po edycji.');
}

// Funkcja do eksportu do pliku PDF (z bazy danych)
function exportToPdf() {
    const measurements = loadMeasurements();
    
    if (measurements.length === 0) {
        alert('Brak danych do eksportu. Dodaj co najmniej jeden pomiar.');
        return;
    }
    
    // Sortowanie pomiarów chronologicznie (od najstarszych)
    measurements.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    // Przygotowanie danych dla tabeli
    const tableData = measurements.map(measurement => [
        measurement.date,
        measurement.systolic.toString(),
        measurement.diastolic.toString()
    ]);
    
    // Tworzenie instancji jsPDF
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Dodanie tytułu i daty wygenerowania
    doc.setFontSize(16);
    doc.text('Raport pomiarów ciśnienia krwi', 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`Data wygenerowania: ${new Date().toLocaleString('pl-PL')}`, 105, 30, { align: 'center' });
    
    // Dodanie tabeli za pomocą autoTable
    doc.autoTable({
        head: [['Data pomiaru', 'Ciśnienie skurczowe (mmHg)', 'Ciśnienie rozkurczowe (mmHg)']],
        body: tableData,
        startY: 40,
        theme: 'grid',
        styles: {
            fontSize: 10,
            cellPadding: 5,
            overflow: 'linebreak'
        },
        headStyles: {
            fillColor: [240, 240, 240],
            textColor: [50, 50, 50],
            fontStyle: 'bold'
        },
        alternateRowStyles: {
            fillColor: [248, 248, 248]
        },
        margin: { top: 40, left: 10, right: 10, bottom: 10 }
    });
    
    // Pobranie pliku PDF
    const fileName = `raport_cisnienia_${new Date().toISOString().split('T')[0]}.pdf`;
    doc.save(fileName);
    
    alert('Plik PDF został utworzony pomyślnie na podstawie bazy danych.');
}

// Funkcja do czyszczenia bazy danych
function clearDatabase() {
    if (confirm('Czy na pewno chcesz wyczyścić całą bazę danych? To działanie jest nieodwracalne.')) {
        localStorage.removeItem('bloodPressureMeasurements');
        displayMeasurements([]);
        alert('Baza danych została wyczyszczona. Zalecam ręczne usunięcie pliku JSON z dysku.');
    }
}

// Funkcja do importu z pliku JSON
function importFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedMeasurements = JSON.parse(e.target.result);
            if (Array.isArray(importedMeasurements)) {
                saveMeasurements(importedMeasurements);
                displayMeasurements(importedMeasurements);
                alert('Baza danych została pomyślnie zaimportowana.');
            } else {
                alert('Nieprawidłowy format pliku JSON. Oczekiwana tablica obiektów.');
            }
        } catch (error) {
            alert('Błąd podczas odczytu pliku: ' + error.message);
        }
    };
    reader.readAsText(file);
}

// Obsługa formularza (z automatycznym eksportem do JSON po zapisie)
document.getElementById('measurementForm').addEventListener('submit', function(event) {
    event.preventDefault();
    
    const systolic = parseInt(document.getElementById('systolic').value);
    const diastolic = parseInt(document.getElementById('diastolic').value);
    const now = new Date();
    const date = now.toLocaleString('pl-PL');
    
    const measurements = loadMeasurements();
    measurements.push({
        systolic: systolic,
        diastolic: diastolic,
        date: date
    });
    
    saveMeasurements(measurements);
    displayMeasurements(measurements);
    
    // Automatyczny eksport do pliku JSON po każdym zapisie
    exportDatabaseToJson(measurements);
    
    // Wyczyść formularz
    document.getElementById('measurementForm').reset();
    
    alert('Pomiar został zapisany i baza zaktualizowana w pliku JSON.');
});

// Ładowanie i wyświetlanie istniejących pomiarów przy starcie
document.addEventListener('DOMContentLoaded', function() {
    const measurements = loadMeasurements();
    displayMeasurements(measurements);
});