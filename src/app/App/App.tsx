import { useEffect } from 'react'
import './App.css'
import {
  Navigate,
  Routes,
  Route
} from "react-router-dom";
import Header from '../../components/Header/Header';
import GenerateSlices from '../../pages/GenerateSlices/GenerateSlices';
import { HomeStep } from '../../pages/GenerateSlices/components/HomeStep/HomeStep';
import { UploadStep } from '../../pages/GenerateSlices/components/UploadStep/UploadStep';
import { RegionsStep } from '../../pages/GenerateSlices/components/RegionsStep/RegionsStep';
import { MetadataStep } from '../../pages/GenerateSlices/components/MetadataStep/MetadataStep';
import { ExportStep } from '../../pages/GenerateSlices/components/ExportStep/ExportStep';
import Archives from '../../pages/Archives/Archives';
import Photo from '../../pages/Photo/Photo';
import { workflowDraftRepository } from '../../lib/workflowDraft';
import { ErrorPage } from '../../components/ErrorPage/ErrorPage';

function App() {
  useEffect(() => {
    void workflowDraftRepository.deleteEnded().catch((error: unknown) => {
      console.error("Couldn't delete completed workflow drafts", error);
    });
  }, []);

  return (
    <>
      <Header/>

      <main className="app-content">
        <Routes>
          <Route element={<GenerateSlices />}>
            <Route index element={<HomeStep />} />
            <Route path="generate">
              <Route index element={<Navigate to="upload" replace />} />
              <Route path="upload" element={<UploadStep />} />
              <Route path="regions" element={<RegionsStep />} />
              <Route path="metadata" element={<MetadataStep />} />
              <Route path="export" element={<ExportStep />} />
            </Route>
          </Route>
          <Route path="/archives" element={<Archives />} />
          <Route path='/photo' element={<Photo/>}/>
          <Route path="*" element={<ErrorPage type="not-found" />} />
        </Routes>
      </main>
    </>
  );
}

export default App
