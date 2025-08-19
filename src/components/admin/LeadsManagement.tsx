import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const LeadsManagement: React.FC = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <label htmlFor="leads-file" className="block text-sm font-medium text-gray-700">
              Upload Leads File
            </label>
            <div className="mt-1 flex items-center">
              <Input id="leads-file" type="file" />
              <Button className="ml-4">Upload</Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeadsManagement;